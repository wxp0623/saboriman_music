# .devcontainer/Dockerfile
FROM golang:1.22-bullseye

# Arguments passed from devcontainer.json
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=1000

ENV DEBIAN_FRONTEND=noninteractive
ENV GOPATH=/go
ENV GOMODCACHE=/go/pkg/mod
ENV GOFLAGS=-mod=mod

# install common tools and delve(for debugging)
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     ca-certificates curl git build-essential procps sudo lsb-release \
     make unzip \
     ffmpeg \
  && rm -rf /var/lib/apt/lists/*

# install Node.js (LTS version)
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - \
  && apt-get install -y nodejs

# install pnpm and yarn
RUN npm install -g pnpm yarn

# install Delve
RUN go install github.com/go-delve/delve/cmd/dlv@latest

# create user
RUN groupadd --gid $USER_GID $USERNAME || true \
  && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME \
  && echo "$USERNAME ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/$USERNAME \
  && chmod 0440 /etc/sudoers.d/$USERNAME

# ensure directories exist and have permissions
RUN mkdir -p /workspace /go/pkg/mod /go/bin \
  && chown -R $USERNAME:$USERNAME /workspace /go

ENV PATH=$PATH:/go/bin

WORKDIR /workspace

# switch to non-root
USER $USERNAME

# Keep container running for devcontainer
CMD [ "sleep", "infinity" ]
