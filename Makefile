.PHONY: build run test dlv

build:
	go build -v ./...

run:
	go run ./cmd/server

test:
	go test ./... -v

dlv:
	dlv debug ./cmd/server --headless --listen=:2345 --api-version=2 --accept-multiclient
