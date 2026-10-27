import pygame
import Tank
import Labirint
import Button
import SoundGame


pygame.init()

SCREEN_WIDTH = 800
SCREEN_HEIGHT = 640
BG = (20, 20, 25)

screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption('Inertial Tanks')

#load image
start_img=pygame.image.load(r'C:\Отчеты\СЯП\PLAY.png')
exit_img=pygame.image.load(r'C:\Отчеты\СЯП\EXIT.png')

#crate buttons
start_button =Button.Button(SCREEN_WIDTH//2-130,SCREEN_HEIGHT//2-150,start_img,1)
exit_button =Button.Button(SCREEN_WIDTH//2-130,SCREEN_HEIGHT//2-50,exit_img,1)

#FLAG
moving_left = False
moving_right = False
moving_up = False
moving_down = False
start_game =False

grid = Labirint.load_map("arena.txt")

walls = Labirint.build_walls(grid)
start_x, start_y = Labirint.get_start_position(grid)

player = Tank.Tank(start_x, start_y, 0.07, 1.5)
SoundGame.init_sound()

clock = pygame.time.Clock()
FPS = 60

run = True
while run:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            run = False
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_a:
                moving_left = True
            if event.key == pygame.K_d:
                moving_right = True
            if event.key == pygame.K_w:
                moving_up = True
            if event.key == pygame.K_s:
                moving_down = True
            if event.key == pygame.K_ESCAPE:
                start_game = False
        elif event.type == pygame.KEYUP:
            if event.key == pygame.K_a:
                moving_left = False
            if event.key == pygame.K_d:
                moving_right = False
            if event.key == pygame.K_w:
                moving_up = False
            if event.key == pygame.K_s:
                moving_down = False

    if start_game == False:
        screen.fill(BG)
        if start_button.draw(screen):
            start_game = True
        if exit_button.draw(screen):
            run = False
    else:

        old_x = player.x
        old_y = player.y
        player.move(moving_left, moving_right, moving_up, moving_down, walls)

        if player.x - player.radius < 0 or player.x + player.radius > SCREEN_WIDTH:
            player.x = old_x
            player.vx = 0
        if player.y - player.radius < 0 or player.y + player.radius > SCREEN_HEIGHT:
            player.y = old_y
            player.vy = 0

        Labirint.draw_level(screen, walls, grid)
        player.draw(screen)

    pygame.display.flip()
    clock.tick(FPS)