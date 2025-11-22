# ARM compiler wrapper for webfsd cross-compilation
# Uses native ARM gcc via QEMU emulation (no musl.cc download needed)

FROM --platform=linux/arm/v7 alpine:3.19

# Install build tools and Linux headers
RUN apk add --no-cache \
    gcc \
    musl-dev \
    linux-headers \
    binutils

# Set working directory
WORKDIR /src

# Container is used as compiler/strip wrapper via docker run
# No default command - commands are passed via docker run
ENTRYPOINT []
CMD ["/bin/sh"]
