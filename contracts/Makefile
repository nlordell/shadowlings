.PHONY: all
all: test

.PHONY: test
test:
	$(MAKE) foundry CMD="forge test -vvv"

.PHONY: deploy
deploy:
	$(MAKE) foundry CMD="forge script script/Shadowlings.s.sol:ShadowlingsDeploy --chain 1337 --rpc-url http://devnet.otim.xyz --private-key $(PK) --broadcast -vvv"

.PHONY: foundry
foundry:
	docker run --rm \
		-v $$(pwd):/contracts:z \
		-w /contracts \
		-p 8545:8545 \
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
