import pygame
import math


class Tank(pygame.sprite.Sprite):
    def __init__(self, x, y, scale, speed):
        pygame.sprite.Sprite.__init__(self)
        self.x = float(x)
        self.y = float(y)
        self.vx = 0.0
        self.vy = 0.0
        self.angle = 0.0
        self.thrust = 0.3
        self.friction = 0.98
        self.rotation_speed = 3
        self.max_speed = 3

        img = pygame.image.load(r'C:\Отчеты\СЯП\unnamed.png')
        self.original_image = pygame.transform.scale(img,(int(img.get_width() * scale), int(img.get_height() * scale)))
        self.image = self.original_image
        self.rect = self.image.get_rect(center=(self.x, self.y))
        self.radius = self.image.get_width() // 2

    def move(self, moving_left, moving_right, moving_up, moving_down, walls):
        if moving_left:
            self.angle -= self.rotation_speed
        if moving_right:
            self.angle += self.rotation_speed
        self.angle = self.angle % 360

        rad = math.radians(self.angle)

        if moving_up:
            self.vx -= self.thrust * math.cos(rad)
            self.vy -= self.thrust * math.sin(rad)

        if moving_down:
            self.vx += self.thrust * math.cos(rad)
            self.vy += self.thrust * math.sin(rad)

        self.vx = self.vx * self.friction
        self.vy = self.vy * self.friction

        if abs(self.vx) < 0.01:
            self.vx = 0
        if abs(self.vy) < 0.01:
            self.vy = 0

        speed = math.hypot(self.vx, self.vy)
        if speed > self.max_speed:
            self.vx = self.vx / speed * self.max_speed
            self.vy = self.vy / speed * self.max_speed

        self.try_move(self.vx, 0, walls)
        self.try_move(0, self.vy, walls)

        self.rect = self.image.get_rect(center=(int(self.x), int(self.y)))

    def try_move(self, dx, dy, walls):
        if dx == 0 and dy == 0:
            return

        old_x = self.x
        old_y = self.y

        self.x += dx
        self.y += dy

        for wall in walls:
            if self.check_circle(self.x, self.y, wall):
                self.x = old_x
                self.y = old_y
                if dx != 0:
                    self.vx = 0
                if dy != 0:
                    self.vy = 0
                return

    def check_circle(self, cx, cy, rect):
        closest_x = max(rect.left, min(cx, rect.right))
        closest_y = max(rect.top, min(cy, rect.bottom))
        dx = cx - closest_x
        dy = cy - closest_y
        if dx * dx + dy * dy <= self.radius * self.radius:
            return True
        return False

    def draw(self, screen):
        self.image = pygame.transform.rotate(self.original_image, -self.angle - 90)
        self.rect = self.image.get_rect(center=(int(self.x), int(self.y)))
        screen.blit(self.image, self.rect)