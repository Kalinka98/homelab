COMPOSE = docker compose

STACKS = infrastructure media services immich dawarich

.PHONY: help validate ps up down restart pull build update

help:
	@echo "Homelab management"
	@echo ""
	@echo "  make validate   Validate all Compose files"
	@echo "  make ps         Show containers in all stacks"
	@echo "  make up         Start all stacks"
	@echo "  make down       Stop and remove all stacks"
	@echo "  make restart    Restart all stacks"

validate:
	@for stack in $(STACKS); do \
		echo "==> Validating $$stack"; \
		$(COMPOSE) -f $$stack/docker-compose.yml config --quiet || exit 1; \
	done

ps:
	@for stack in $(STACKS); do \
		echo ""; \
		echo "==> $$stack"; \
		$(COMPOSE) -f $$stack/docker-compose.yml ps; \
	done

up:
	@for stack in $(STACKS); do \
		echo "==> Starting $$stack"; \
		$(COMPOSE) -f $$stack/docker-compose.yml up -d --remove-orphans; \
	done

down:
	@for stack in $(STACKS); do \
		echo "==> Stopping $$stack"; \
		$(COMPOSE) -f $$stack/docker-compose.yml down; \
	done

restart:
	@for stack in $(STACKS); do \
		echo "==> Restarting $$stack"; \
		$(COMPOSE) -f $$stack/docker-compose.yml restart; \
	done