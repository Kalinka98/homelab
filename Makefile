COMPOSE = docker compose
STACKS = infrastructure media services immich dawarich paperless

.PHONY: help validate validate-examples ps up down restart pull

help:
	@echo "Homelab management"
	@echo ""
	@echo "  make validate           Validate local configurations (.env per stack)"
	@echo "  make validate-examples  Validate tracked .env.example configurations"
	@echo "  make ps                 Show containers in all stacks"
	@echo "  make up                 Start all stacks (live credentials required)"
	@echo "  make down               Stop and remove containers in all stacks"
	@echo "  make restart            Restart all stacks"
	@echo "  make pull               Pull images in all stacks"

validate:
	@set -e; for stack in $(STACKS); do \
		echo "==> Validating $$stack with local .env"; \
		test -f "$$stack/.env" || { echo "Missing $$stack/.env"; exit 1; }; \
		(cd "$$stack" && $(COMPOSE) config --quiet); \
	done

validate-examples:
	@set -e; for stack in $(STACKS); do \
		echo "==> Validating $$stack/.env.example"; \
		(cd "$$stack" && $(COMPOSE) --env-file .env.example config --quiet); \
	done

ps:
	@set -e; for stack in $(STACKS); do \
		echo "==> $$stack"; \
		(cd "$$stack" && $(COMPOSE) ps); \
	done

up:
	@set -e; for stack in $(STACKS); do \
		echo "==> Starting $$stack"; \
		test -f "$$stack/.env" || { echo "Missing $$stack/.env"; exit 1; }; \
		(cd "$$stack" && $(COMPOSE) up -d --remove-orphans); \
	done

down:
	@set -e; for stack in $(STACKS); do \
		echo "==> Stopping $$stack"; \
		(cd "$$stack" && $(COMPOSE) down); \
	done

restart:
	@set -e; for stack in $(STACKS); do \
		echo "==> Restarting $$stack"; \
		(cd "$$stack" && $(COMPOSE) restart); \
	done

pull:
	@set -e; for stack in $(STACKS); do \
		echo "==> Pulling $$stack"; \
		(cd "$$stack" && $(COMPOSE) pull); \
	done
