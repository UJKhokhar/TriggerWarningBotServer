// This file contains various helper functions

import { gameUpsert } from "./db.js";
import _ from 'lodash';

const pokemonArceusData = {
  name: '     Pokémon Legends: Arceus   ',
  triggers: 'fantasy violence, bugs, ghosts, spiders',
};

const gameData = {
  name: 'Rogue Company',
  triggers: 'Gun violence, explosions, flashing lights, spiders',
}

// Trim game name
gameData.name = gameData.name.trim();

// Coerce comma separated list into an array
const triggersArray = gameData.triggers.split(',');
const lowercaseTriggers = triggersArray.map(trigger => trigger.trim().toLowerCase());
const uniqueTriggers = _.uniq(lowercaseTriggers);

gameData.triggers = uniqueTriggers;

// Function to add the above test data into the database
export const addGameToDB = (gameData) => {
  gameUpsert(gameData);
};