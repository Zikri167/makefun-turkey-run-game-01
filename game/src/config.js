// Turkey Run: Great Escape — configuration (all tuning in one place).
'use strict';
const CONFIG = {
  W: 1280,
  H: 720,
  GROUND_Y: 600,
  GOAL_M: 1000,          // metres to the safe barn
  PX_PER_M: 30,          // travelled px per metre
  PLAYER_X: 230,
  PLAYER_H: 84,          // standing height; ducking height is 52 (see main.js playerBox)
  GRAVITY: 2600,
  JUMP_V: 980,
  BASE_SPEED: 430,
  MAX_SPEED: 780,
  LIVES: 3,
  FARMER_GAP_START: 190,
  FARMER_GAP_MIN: 0,
  CORN_SCORE: 100,
  DRUM_SCORE: 500,
  ESCAPE_BONUS: 2000,
  // Warm Thanksgiving palette
  COLORS: {
    skyTop: '#5b2a6e', skyMid: '#c94b4b', skyLow: '#ff9a3c',
    sun: '#ffd76a', sunCore: '#fff3b0',
    hillFar: '#7a3b2e', hillNear: '#5d2a1e',
    ground: '#8a5a2b', groundTop: '#b5773a', grass: '#c98a3d',
    barn: '#7e2f1d', barnRoof: '#4a1d12', barnTrim: '#f2e3c6',
    turkeyBody: '#8a5a2b', turkeyBreast: '#c98a4b', turkeyWing: '#6e4520',
    turkeyHead: '#d97b4f', turkeyWattle: '#d42b2b', turkeyBeak: '#f2a541',
    farmerShirt: '#3f6fb5', farmerPants: '#4a3220', farmerHat: '#e8c33c',
    oven: '#3a3a40', ovenGlow: '#ff7a1a', ovenFire: '#ffc93c',
    knife: '#dfe6ee', knifeHandle: '#5b2a1a',
    corn: '#ffd23e', cornHusk: '#4e9b3a',
    drumstick: '#e8a34c', drumBone: '#fff6e0',
  },
};
