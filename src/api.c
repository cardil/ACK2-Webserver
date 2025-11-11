#include <sys/socket.h>
#include <netinet/in.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <sys/stat.h>
#include <time.h>
#include <ctype.h>
#include "api.h"

// External variables and functions from request.c
extern int read_mesh_from_printer_config(void);
extern int mesh_grid;
extern int bed_temp;
extern double z_offset;
extern char mesh_config[]; // Use mesh_config, it holds the flat string
extern double precision;
extern int detect_printer_defaults(const char **printer_model, const char **cfg_path, const char **cfg_filename, int *grid_size);
extern int update_printer_config_file(const char *config_file, const char *parameter_name, const char *replacement_value);
extern config_option_t leveling_config;
extern config_option_t set_key_value(config_option_t conf_opt, char *key, char *value);
extern int write_config_file(char *path, config_option_t conf_opt);

// A buffer to hold the JSON response
static char api_response_buffer[8192];

// Helper to trim trailing whitespace (like newlines) from a string
void trim_trailing_whitespace(char *str) {
    if (str == NULL) return;
    int i = strlen(str) - 1;
    while (i >= 0 && isspace((unsigned char)str[i])) {
        str[i] = '\0';
        i--;
    }
}

static void handle_get_leveling_status(struct REQUEST *req) {
    read_mesh_from_printer_config();
    trim_trailing_whitespace(mesh_config);

    int len = snprintf(api_response_buffer, sizeof(api_response_buffer),
             "{"
             "\"settings\": {"
             "\"grid_size\": %d,"
             "\"bed_temp\": %d,"
             "\"precision\": %.4f,"
             "\"z_offset\": %.4f"
             "},"
             "\"active_mesh\": {"
             "\"mesh_data\": \"%s\""
             "},"
             "\"saved_meshes\": [",
             mesh_grid, bed_temp, precision, z_offset, mesh_config);

    int first_mesh = 1;
    for (int i = 1; i < 100; i++) {
        char fn_buf[64];
        sprintf(fn_buf, "/user/webfs/data_slot_%d.txt", i);
        
        struct stat st;
        if (stat(fn_buf, &st) == 0) {
            FILE *file = fopen(fn_buf, "r");
            if (file) {
                if (!first_mesh) {
                    len += snprintf(api_response_buffer + len, sizeof(api_response_buffer) - len, ",");
                }
                char mesh_data[4096] = {0};
                fread(mesh_data, 1, sizeof(mesh_data) - 1, file);
                fclose(file);
                trim_trailing_whitespace(mesh_data);
                
                char date_buf[20];
                strftime(date_buf, sizeof(date_buf), "%%Y-%%m-%%d %%H:%%M:%%S", localtime(&st.st_mtime));

                len += snprintf(api_response_buffer + len, sizeof(api_response_buffer) - len,
                                "{\"id\": %d, \"date\": \"%s\", \"mesh_data\": \"%s\"}",
                                i, date_buf, mesh_data);
                first_mesh = 0;
            }
        }
    }
    
    len += snprintf(api_response_buffer + len, sizeof(api_response_buffer) - len, "]}");

    req->body = api_response_buffer;
    req->lbody = len;
    req->mime = "application/json";
    mkheader(req, 200);
}

static void handle_delete_mesh_slot(struct REQUEST *req) {
    const char *prefix = "/api/leveling/mesh/";
    int slot_id = atoi(req->path + strlen(prefix));

    if (slot_id > 0 && slot_id < 100) {
        char fn_buf[64];
        sprintf(fn_buf, "/user/webfs/data_slot_%d.txt", slot_id);
        if (remove(fn_buf) == 0) {
            snprintf(api_response_buffer, sizeof(api_response_buffer),
                     "{\"status\": \"success\", \"message\": \"Mesh slot %d deleted.\"}", slot_id);
            mkheader(req, 200);
        } else {
            snprintf(api_response_buffer, sizeof(api_response_buffer),
                     "{\"status\": \"error\", \"message\": \"Could not delete mesh slot %d. It may not exist.\"}", slot_id);
            mkheader(req, 404);
        }
    } else {
        snprintf(api_response_buffer, sizeof(api_response_buffer), "{\"status\": \"error\", \"message\": \"Invalid slot ID.\"}");
        mkheader(req, 400);
    }
    req->body = api_response_buffer;
    req->lbody = strlen(api_response_buffer);
    req->mime = "application/json";
}

// Forward declarations for our new handlers
static void handle_get_leveling_status(struct REQUEST *req);
static void handle_delete_mesh_slot(struct REQUEST *req);
static void handle_put_mesh_slot(struct REQUEST *req);
static void handle_put_printer_mesh(struct REQUEST *req);
static void handle_put_settings(struct REQUEST *req);

void handle_api_request(struct REQUEST *req, char *filename) {
    req->cache_turn_off = 'Y';

    if (strcmp(req->path, "/api/leveling") == 0 && strcmp(req->type, "GET") == 0) {
        handle_get_leveling_status(req);
        return;
    }

    if (strncmp(req->path, "/api/leveling/mesh/", 19) == 0) {
        if (strcmp(req->type, "DELETE") == 0) {
            handle_delete_mesh_slot(req);
            return;
        }
        if (strcmp(req->type, "PUT") == 0) {
            handle_put_mesh_slot(req);
            return;
        }
    }

    if (strcmp(req->path, "/api/leveling/printer-mesh") == 0 && strcmp(req->type, "PUT") == 0) {
        handle_put_printer_mesh(req);
        return;
    }

    if (strcmp(req->path, "/api/leveling/settings") == 0 && strcmp(req->type, "PUT") == 0) {
        handle_put_settings(req);
        return;
    }

    snprintf(api_response_buffer, sizeof(api_response_buffer), "{\"status\": \"error\", \"message\": \"API endpoint not found\"}");
    req->body = api_response_buffer;
    req->lbody = strlen(api_response_buffer);
    req->mime = "application/json";
    mkheader(req, 404);
}

extern int custom_copy_file(const char *from, const char *to, const char *mode, const char *buffer);

// Simple JSON parser to find a value by key
char* get_json_value(char* json, const char* key) {
    char* key_ptr = strstr(json, key);
    if (!key_ptr) return NULL;

    char* value_ptr = strchr(key_ptr, ':');
    if (!value_ptr) return NULL;

    value_ptr++; // Move past ':'
    while (isspace(*value_ptr)) value_ptr++; // Skip whitespace

    if (*value_ptr == '"') {
        value_ptr++; // Move past '"'
        char* end_ptr = strchr(value_ptr, '"');
        if (!end_ptr) return NULL;
        *end_ptr = '\0';
        return value_ptr;
    } else {
        // It's a number or boolean - find the end
        char* end_ptr = value_ptr;
        while (*end_ptr && *end_ptr != ',' && *end_ptr != '}' && *end_ptr != ']') {
            end_ptr++;
        }
        *end_ptr = '\0';
        return value_ptr;
    }
}

static void handle_put_mesh_slot(struct REQUEST *req) {
    const char *prefix = "/api/leveling/mesh/";
    int slot_id = atoi(req->path + strlen(prefix));

    if (slot_id <= 0 || slot_id >= 100) {
        snprintf(api_response_buffer, sizeof(api_response_buffer), "{\"status\": \"error\", \"message\": \"Invalid slot ID.\"}");
        mkheader(req, 400);
    } else if (req->req_body == NULL) {
        snprintf(api_response_buffer, sizeof(api_response_buffer), "{\"status\": \"error\", \"message\": \"Missing request body.\"}");
        mkheader(req, 400);
    } else {
        char* mesh_data = get_json_value(req->req_body, "\"mesh_data\"");
        if (mesh_data) {
            char fn_buf[64];
            sprintf(fn_buf, "/user/webfs/data_slot_%d.txt", slot_id);
            if (custom_copy_file(NULL, fn_buf, "wb", mesh_data) == 0) {
                 snprintf(api_response_buffer, sizeof(api_response_buffer),
                         "{\"status\": \"success\", \"message\": \"Mesh saved to slot %d.\"}", slot_id);
                 mkheader(req, 200);
            } else {
                snprintf(api_response_buffer, sizeof(api_response_buffer), "{\"status\": \"error\", \"message\": \"Failed to write to file.\"}");
                mkheader(req, 500);
            }
        } else {
            snprintf(api_response_buffer, sizeof(api_response_buffer), "{\"status\": \"error\", \"message\": \"Invalid JSON payload. Missing 'mesh_data'.\"}");
            mkheader(req, 400);
        }
    }

    req->body = api_response_buffer;
    req->lbody = strlen(api_response_buffer);
    req->mime = "application/json";
}

static void handle_put_printer_mesh(struct REQUEST *req) {
    if (req->req_body == NULL) {
        snprintf(api_response_buffer, sizeof(api_response_buffer), "{\"status\": \"error\", \"message\": \"Missing request body.\"}");
        mkheader(req, 400);
    } else {
        char* mesh_data = get_json_value(req->req_body, "\"mesh_data\"");
        if (mesh_data) {
            const char *config_file;
            if (detect_printer_defaults(NULL, &config_file, NULL, NULL) == 0) {
                if (update_printer_config_file(config_file, "points", mesh_data) == 0) {
                    snprintf(api_response_buffer, sizeof(api_response_buffer), "{\"status\": \"success\", \"message\": \"Active printer mesh updated. Please reboot for changes to take effect.\"}");
                    mkheader(req, 200);
                } else {
                    snprintf(api_response_buffer, sizeof(api_response_buffer), "{\"status\": \"error\", \"message\": \"Failed to update printer configuration.\"}");
                    mkheader(req, 500);
                }
            } else {
                snprintf(api_response_buffer, sizeof(api_response_buffer), "{\"status\": \"error\", \"message\": \"Could not detect printer configuration file.\"}");
                mkheader(req, 500);
            }
        } else {
            snprintf(api_response_buffer, sizeof(api_response_buffer), "{\"status\": \"error\", \"message\": \"Invalid JSON payload. Missing 'mesh_data'.\"}");
            mkheader(req, 400);
        }
    }
    req->body = api_response_buffer;
    req->lbody = strlen(api_response_buffer);
    req->mime = "application/json";
}

static void handle_put_settings(struct REQUEST *req) {
    if (req->req_body == NULL) {
        snprintf(api_response_buffer, sizeof(api_response_buffer), "{\"status\": \"error\", \"message\": \"Missing request body.\"}");
        mkheader(req, 400);
    } else {
        // Get the current state before making changes
        read_mesh_from_printer_config();
        int current_grid_size = mesh_grid;
        int grid_size_changed = 0;

        // A copy of the body is needed because get_json_value modifies the string
        char body_copy[req->content_length + 1];
        strcpy(body_copy, req->req_body);

        char* grid_size_str = get_json_value(body_copy, "\"grid_size\"");
        char* bed_temp_str = get_json_value(body_copy, "\"bed_temp\"");
        char* precision_str = get_json_value(body_copy, "\"precision\"");
        
        const char *config_file;
        if (detect_printer_defaults(NULL, &config_file, NULL, NULL) != 0) {
            snprintf(api_response_buffer, sizeof(api_response_buffer), "{\"status\": \"error\", \"message\": \"Could not detect printer configuration file.\"}");
            mkheader(req, 500);
        } else {
            if (grid_size_str) {
                int new_grid_size = atoi(grid_size_str);
                if (new_grid_size > 0 && new_grid_size != current_grid_size) {
                    grid_size_changed = 1;

                    // 1. Invalidate active mesh by creating a flat one
                    char flat_mesh[4096] = {0};
                    int len = 0;
                    for (int i = 0; i < new_grid_size * new_grid_size; i++) {
                        len += snprintf(flat_mesh + len, sizeof(flat_mesh) - len, "0.000000%s", (i == (new_grid_size * new_grid_size - 1)) ? "" : ", ");
                    }
                    update_printer_config_file(config_file, "points", flat_mesh);

                    // 2. Delete all saved mesh slots
                    for (int i = 1; i < 100; i++) {
                        char fn_buf[64];
                        sprintf(fn_buf, "/user/webfs/data_slot_%d.txt", i);
                        remove(fn_buf);
                    }

                    // 3. Update probe_count
                    char replacement_value[8];
                    sprintf(replacement_value, "%d,%d", new_grid_size, new_grid_size);
                    update_printer_config_file(config_file, "probe_count", replacement_value);
                }
            }
            if (bed_temp_str) {
                update_printer_config_file(config_file, "bed_mesh_temp", bed_temp_str);
            }
            if (precision_str) {
                leveling_config = set_key_value(leveling_config, "precision", precision_str);
                write_config_file("/user/webfs/parameters.cfg", leveling_config);
            }
            snprintf(api_response_buffer, sizeof(api_response_buffer), "{\"status\": \"success\", \"message\": \"Settings updated. Please reboot for changes to take effect.\", \"grid_size_changed\": %s}", grid_size_changed ? "true" : "false");
            mkheader(req, 200);
        }
    }
    req->body = api_response_buffer;
    req->lbody = strlen(api_response_buffer);
    req->mime = "application/json";
}
