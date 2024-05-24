.DEFAULT_GOAL := all

.PHONY: all
all: test

.PHONY: test
test:
	$(MAKE) foundry CMD="forge test -vvv"

.PHONY: foundry
foundry:
	docker run --rm \
		-v $$(pwd):/contracts:z \
		-w /contracts \
		-p 8545:8545 \
		ghcr.io/paradigmxyz/foundry-alphanet:latest \
		--foundry-command "$(CMD)"

.PHONY: install
install:
	git submodule update --init --recursive
