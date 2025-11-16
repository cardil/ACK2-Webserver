# Installation Guide

Complete installation instructions for the AK2 Dashboard.

## Prerequisites

**⚠️ Jailbroken Printer Required**

This dashboard requires a jailbroken Kobra 2 Series printer (Pro, Plus, or Max) with SSH access.

**⚠️ No Firmware Downloads Here**

This project does NOT host or distribute firmware files. All firmware comes from Anycubic's official sources, downloaded legally via the [kobra2-fw-tools](https://github.com/cardil/kobra2-fw-tools) scripts.

---

## Installation Paths

Choose your path based on your printer's current state:

### Path A: Already Jailbroken ✅

If your printer already has:
- Custom firmware with SSH enabled
- Root access configured

**Quick Deployment:**

If you have `unzip` and `openssh-sftp-server` installed on your printer:

```bash
# Clone this repository
git clone https://github.com/cardil/ACK2-Webserver
cd ACK2-Webserver

# Deploy directly to printer
make deploy PRINTER_IP=192.168.1.100
```

**Customization:**

```bash
# Custom SSH port, user, or webserver port
make deploy PRINTER_IP=192.168.1.100 PRINTER_PORT=2222 PRINTER_USER=admin WEBFSD_PORT=8080
```

**Prerequisites on Printer:**

If not already installed:

```bash
ssh root@PRINTER_IP
opkg update
opkg install unzip openssh-sftp-server
```

**Alternative:** Follow **Path B** below to rebuild your complete custom firmware with the latest webserver version.

---

### Path B: New Installation 🔧

Complete setup from scratch, including jailbreak.

#### Step 1: Jailbreak Your Printer

**Required:**
- USB-to-UART adapter (3.3V)
- Access to printer mainboard
- USB drive (FAT32, any size)

**Process:**

1. **Connect UART Console**
   - Follow: [UART Guide](https://github.com/cardil/kobra2-fw-tools/blob/main/docs/UART.md)
   - Downgrade to firmware 2.3.9 first (if needed)
   - Connect UART adapter to mainboard header
   - DO NOT connect +5V pin

2. **Gain Root Access**
   - Follow: [ROOT Guide](https://github.com/cardil/kobra2-fw-tools/blob/main/docs/ROOT.md)
   - Intercept boot by pressing `s` key
   - Set root password via u-boot
   - Install SSH access

**Complete Documentation:** [kobra2-fw-tools](https://github.com/cardil/kobra2-fw-tools)

#### Step 2: Build Custom Firmware

Clone the firmware tools repository:

```bash
git clone https://github.com/cardil/kobra2-fw-tools
cd kobra2-fw-tools
```

Download Anycubic's official firmware (replace with your model and version):

```bash
# For Kobra 2 Pro:
./fwdl.sh K2Pro 3.0.9

# For Kobra 2 Plus:
./fwdl.sh K2Plus 3.0.9

# For Kobra 2 Max:
./fwdl.sh K2Max 3.0.9
```

Unpack the firmware:

```bash
./unpack.sh FW/update_3.0.9.swu
```

#### Step 3: Configure Options

Edit `options.cfg` to enable the webserver and other features:

```ini
# Enable the webserver
webserver="webfs-v5:8000"

# Enable SSH access
ssh="yes"

# Enable root access
root_access="yes"
root_password="your_secure_password"

# Optional: Enable Kobra Unleashed MQTT redirect
# modify_mqtt="yes"
# mqtt_url="your-mqtt-server-ip"
```

**Available Options:** See [OPTIONS.md](https://github.com/cardil/kobra2-fw-tools/blob/main/docs/OPTIONS.md) for all configuration options.

#### Step 4: Build the Firmware

Run the build script:

```bash
./build.sh
```

This will:
1. Download and build the webserver from source
2. Patch the firmware with your options
3. Create `update/update.swu`

#### Step 5: Flash the Firmware

**Via USB (Recommended for first flash):**

1. Format a USB drive as FAT32
2. Create a folder named `update` on the USB drive
3. Copy `update/update.swu` into the `update` folder
4. Insert USB drive into printer
5. Navigate to Update menu on printer screen
6. Select USB update
7. Printer will reboot when complete

**Via SSH (If already jailbroken):**

The build script will offer to upload via SSH automatically.

#### Step 6: Access the Dashboard

Once the printer reboots:

1. Find your printer's IP address
   - Check your router's DHCP leases
   - Or check printer's network settings

2. Open in your browser:
   ```
   http://YOUR_PRINTER_IP:8000
   ```

3. You should see the AK2 Dashboard!

---

## Updating the Webserver

To update to the latest webserver version:

### Option 1: Rebuild Firmware

```bash
cd kobra2-fw-tools
# Pull latest changes
git pull

# The build script will fetch the latest webserver
./build.sh

# Flash update/update.swu as before
```

### Option 2: Manual Update (SSH Required)

```bash
# Build the webserver package
cd ACK2-Webserver
make

# Copy to printer
scp webserver/webserver.zip root@PRINTER_IP:/tmp/

# SSH into printer
ssh root@PRINTER_IP

# Extract and install
cd /tmp
unzip webserver.zip
cp -r opt/* /opt/
cp -r mnt/* /mnt/

# Restart webserver
killall webfsd
/opt/bin/webfsd -p 8000 -r /mnt/UDISK/webfs
```

---

## Troubleshooting

### Dashboard Won't Load

**Check network:**
```bash
ping YOUR_PRINTER_IP
```

**Check if webserver is running:**
```bash
ssh root@PRINTER_IP
ps | grep webfsd
```

**Restart webserver manually:**
```bash
ssh root@PRINTER_IP
killall webfsd
/opt/bin/webfsd -p 8000 -r /mnt/UDISK/webfs
```

### Can't Access via SSH

- Verify SSH was enabled in `options.cfg`
- Check if SSH is running: `ps | grep dropbear`
- Ensure you're using the correct root password
- Try default password: `toor` (if you didn't change it)

### Firmware Update Fails

- Verify USB drive is FAT32 formatted
- Ensure `update.swu` is in a folder named `update`
- Check file isn't corrupted (re-download/rebuild)
- For partition >4GB issues, create smaller partition

### Lost Root Access After Update

If you flash stock Anycubic firmware, you'll lose root access. To regain:
- Restore from [eMMC backup](https://github.com/cardil/kobra2-fw-tools/blob/main/docs/EMMC_RESTORE.md), or
- Repeat the jailbreak process

---

## Getting Help

**Community Support:**
- 💬 [Telegram Group](https://t.me/kobra2modding)
- 📖 [Klipper Discourse Thread](https://klipper.discourse.group/t/printer-cfg-for-anycubic-kobra-2-plus-pro-max/11658) (archived)
- 🐛 [GitHub Issues](https://github.com/cardil/ACK2-Webserver/issues)

**Documentation:**
- [kobra2-fw-tools](https://github.com/cardil/kobra2-fw-tools) - Jailbreak and firmware tools
- [Kobra 2 Pro Insights](https://1coderookie.github.io/Kobra2ProInsights) - Comprehensive printer documentation

**Alternative Solutions:**
- [Rinkhals](https://jbatonnet.github.io/Rinkhals) - Modern alternative for Kobra 3 and some K2 Pro units with newer boards

---

## Security Notes

- **Change default password** - Don't use `toor` in production
- **Network security** - Dashboard has no authentication; use on trusted networks only
- **Backup important files** - Always backup `/user` directory before modifications
- **Keep firmware accessible** - Save your working custom firmware files

---

## Legal Notice

This project is not affiliated with or endorsed by Anycubic. Use at your own risk. Modifying firmware may void your warranty.

The custom firmware process uses Anycubic's official firmware files, downloaded from their public servers. No proprietary firmware is distributed by this project.
