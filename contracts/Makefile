RPC_URL ?= http://localhost:8545

.PHONY: all
all: test

.PHONY: test
test:
	$(MAKE) foundry CMD="forge test -vvv"

.PHONY: deploy
deploy:
	$(MAKE) foundry CMD="forge script script/Deploy.s.sol:Deploy --rpc-url $(RPC_URL) --private-key $(PK) --broadcast -vvv"

.PHONY: foundry
foundry:
	docker run --rm \
		-v $$(pwd):/contracts:z \
		-w /contracts \
		ghcr.io/paradigmxyz/foundry-alphanet:latest \
		--foundry-command "$(CMD)"

.PHONY: fmt
fmt:
	docker run --rm \
		-v $$(pwd):/contracts:z \
		-w /contracts \
		--entrypoint /bin/bash \
		ghcr.io/paradigmxyz/foundry-alphanet:latest \
		-c 'forge fmt script/ src/*.sol test/'

.PHONY: install
install:
	git submodule update --init --recursive
