import pygame


def init_sound():
    pygame.mixer.init()
    pygame.mixer.music.load('C:/Отчеты/СЯП/1. Track 1.wav')
    pygame.mixer.music.play(-1)