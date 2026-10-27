import pygame

WINDOW_WIDTH = 800
WINDOW_HEIGHT = 640
TILE_SIZE = 40
WALL_THICKNESS = 20

COLORS = {
    "floor": (30, 30, 35),
    "wall": (90, 90, 100),
    "spawn": (60, 180, 90),
}


def load_map(filename):
    with open(filename, "r", encoding="utf-8") as f:
        lines = f.read().splitlines()

    grid = []
    for line in lines:
        if line.strip() == "":
            continue
        grid.append(line)

    return grid


def validate_map(grid):
    if len(grid) == 0:
        return False, "Карта пустая"

    width = len(grid[0])
    for i, row in enumerate(grid):
        if len(row) != width:
            return False, "Строка " + str(i) + " имеет разную длину"

    spawn_count = 0
    for row in grid:
        for ch in row:
            if ch == "S":
                spawn_count += 1

    if spawn_count == 0:
        return False, "На карте нет точки спавна (S)"
    if spawn_count > 1:
        return False, "На карте больше одной точки спавна"

    return True, "OK"


def build_walls(grid):
    walls = []
    for row_index, row in enumerate(grid):
        for col_index, ch in enumerate(row):
            if ch == "#":
                x = col_index * TILE_SIZE
                y = row_index * TILE_SIZE
                walls.append(pygame.Rect(x, y, TILE_SIZE, TILE_SIZE))
    return walls


def get_start_position(grid):
    for row_index, row in enumerate(grid):
        for col_index, ch in enumerate(row):
            if ch == "S":
                x = col_index * TILE_SIZE + TILE_SIZE // 2
                y = row_index * TILE_SIZE + TILE_SIZE // 2
                return x, y
    return TILE_SIZE, TILE_SIZE


def draw_level(screen, walls, grid):
    screen.fill(COLORS["floor"])
    for wall in walls:
        pygame.draw.rect(screen, COLORS["wall"], wall)

    for row_index, row in enumerate(grid):
        for col_index, ch in enumerate(row):
            if ch == "S":
                x = col_index * TILE_SIZE + TILE_SIZE // 2
                y = row_index * TILE_SIZE + TILE_SIZE // 2
                pygame.draw.circle(screen, COLORS["spawn"], (x, y), 6)