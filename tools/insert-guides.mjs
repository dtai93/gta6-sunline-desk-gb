/**
 * Move each trophy's step object from guide to walkthrough
 * and set guide to a short plain-text summary.
 * Run from the repo root: node tools/insert-guides.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const path = join(root, 'app/data/trophies.json');

/** One to three sentences, source ids in brackets. */
const guides = {
  'vice-got-a-price':
    'Clear the other 54 trophies on one single-player save. The long stretch is the 100% checklist behind A Long Road, which published runs put near 200 hours, and cheats on that save shut off both trophies and saving. [s1][s2][s7][s3]',
  'just-like-paradise':
    'Play the Chapter 1 mission Gone Fishing through to the end. The bronze is for that story clear, not a side objective inside the mission. [s1][s3][s2][s7]',
  'paradise-lost':
    'Finish Chapter 1. Walkthroughs place the pop on the first Chapter 2 mission, What\'s in the Bag?, rather than on the chapter credits. [s1][s3][s7]',
  'ts-ass-drug-money':
    'Finish Chapter 2. The published name keeps the asterisks, and the unlock is reported as Chapter 3 opens, after Welcome to Vice City. [s1][s2][s3][s7]',
  'vice-city-baby':
    'Finish the Chapter 3 story. The pop is placed after the first two Chapter 4 missions, Ocean Beach and Another Life. [s1][s3][s7]',
  'top-of-the-world-ma':
    'Finish Chapter 4. This bronze is separate from the gold for the final mission, and one walkthrough ties the pop to Starting From Zero. [s1][s2][s3]',
  'you-gotta-know-when-to-get-off':
    'Beat the last story mission for the second gold. There is no mission replay, so keep a manual save just before that Chapter 5 finale if you want another ending. [s1][s2][s5][s3]',
  'trust':
    'Finish the Chapter 2 mission Breakfast Run. Partner switching opens around this point, which the later pair trophies need. [s1][s3][s2]',
  'break-the-bank':
    'Finish the Chapter 3 story mission The Cartel Heist. A normal clear is enough. You do not need a flawless heist. [s1][s3][s2]',
  'family-matters':
    'Finish the Chapter 4 mission Child\'s Play. Guides describe it as that chapter\'s rescue job, and clearing the mission is the whole trophy. [s1][s2][s3]',
  'dwnfall':
    'Finish the Chapter 4 mission Headliners. Walkthroughs frame it as helping with a launch party, and the bronze is for completing that mission. [s1][s3]',
  'hi-jacked':
    'Finish the Chapter 4 story mission VCIA Takedown. That scripted airport job is separate from the free-roam passenger-jet theft. [s1][s3][s2]',
  'snow-storm':
    'Finish Operation Savage Glory. Guides place that mission in Chapter 5, after the Chapter 4 story set. [s1][s3]',
  'a-long-road':
    'After the story, open Progress, then Stats, then 100% Completion. Work you already did counts. Some lines are partial, such as 100 optional tasks, 200 of 277 base vehicles, 100 of 255 animals, 70 of 80 challenges, 300 of 397 stunts, and 15 of 18 meditations, while robberies, underwater discoveries, range golds, drone races, and Bret\'s hunts want everything, and nothing on the list is reported as missable. [s2][s6][s3]',
  'cunning-stunts':
    'Finish any 250 stunts. Jumps, bridge flights, knife flights, and base jumps share one total, a single pass is enough, and the tracker is under Progress, Activities, Stunts or the map list. Keep going to 300 for 100%, and bridge passes are the quickest batch. [s1][s3][s2][s6]',
  'master-of-none':
    'Open Progress, then Activities, and try each type once. The in-game tracker is reported as nine: fishing, hunting, golf, a shooting range, pool, a basketball hoop, an arcade game, a race or drone race, and one stunt. Blue icons show up as the fog clears, and a normal platinum run covers each type. [s1][s3][s2]',
  'the-shootist':
    'Earn gold on every shooting-range challenge. The trophy text does not let you skip any, and the matching 100% line is the same 42 of 42 range golds. [s1][s2][s3][s6]',
  'top-fun':
    'Win one Top Fun drone race at each location. Guides count 14 sites, while the 100% checklist is tighter and wants all 42 drone time trials. [s1][s2][s3][s6]',
  'earn-cash-not-kudos':
    'Win 20 different races. Repeating one course does not add a new one. Published maps list about 40 unique races, and 100% only needs 30 of those wins, so this bronze comes first. [s1][s2][s3][s6]',
  'baited-my-tackle':
    'Meet Cal in the Chapter 1 mission Feng Shui, then wait for his text. He marks a fishing spot with a purple icon west of Key Lento. Beat him there. [s3][s1]',
  'stick-fiddler':
    'Finish every level of one video game. The extra challenge goals are not required. Three games sit on the TV at home, including during Chapter 1 (Tenebrae Lux, Street Trash III, and Time Jackers Rewind), Bang For Your Buck is on cabinets around the map, and the home set can lock during story stretches before returning in free roam after the credits. [s1][s3][s2]',
  'road-to-rehabilitation':
    'As Lucia in Chapter 3, take Andy\'s call and follow the marker to her home in Belville. Play her strand through the five stops to the warehouse meetup. It stays on the map after the credits and does not count as one of the eight Strangers and Freaks. [s2][s3][s1]',
  'this-was-no-boat-accident':
    'After Island Dreams, wait for Kenton\'s call and use the green KR marker at his Key Lento shop. Dive the seven wrecks he marks, sweep the seabed with the metal detector, and return the finds. He drops off the map when Chapter 1 ends, then texts again in Chapter 2 or 3, calling Brian as Jason can bring him back sooner, and the trophy is still available after the story. [s3][s1][s5]',
  'the-lone-rider':
    'After Coffee Break in Chapter 2, go to Billy at Thrillbilly Mudclub in Kelly County and finish his five jobs through Hometown Heroes. That last job is the trophy. The strand stays available after the credits and is not one of the eight stranger strands. [s3][s1][s2]',
  'strangers-and-freaks':
    'Finish eight stranger strands. Named givers who already have their own trophies, such as Andy, Billy, and Tyrone, do not fill this counter, while confirmed strands include Kirk\'s skunk-ape hunt, Kyle at McKittrick Farm, Yago\'s street races, and Pilot Pete\'s deliveries. Race Against Yago in Chapter 3 carries an hourglass, and one checklist calls it the only lock for this silver, so do it when it appears even though another guide says the strands remain after the story. [s1][s2][s3][s5]',
  'supply-and-demand':
    'Finish Clonin\' Keys, Makin\' GS so you have the key cloner and have already delivered Randy one sports car, then fill his Wish List by delivering the cars he marks or by scanning traffic with WAiNK and driving matches to his green RK garage in west Vice City. The list stays open after the credits. A car in better shape pays more, but the trophy is for finishing the strand. [s3][s1][s2]',
  'spin-on-this':
    'As Jason, after Here, Kitty Kitty, destroy the Kitty Litter labs Tyrone marks in Vice City. His follow-up, also called Spin On This, is the job that pops the trophy. The labs stay available after the story, and this strand does not count toward Strangers and Freaks. [s3][s4][s1][s2]',
  'positive-mental-attitude':
    'Meditate at all 18 marked spots, tracked under Progress, Collections, Exploration, Meditations, and the same spot can count again when the other character sits there. Pair sessions open after Coffee Break in Chapter 2, 100% only needs 15 of 18, and you should still take the Chapter 1 balcony at Jason\'s house the morning after Down to Earth while you live there, because early notes treated that session as required even though a later checklist says it is not counted. [s1][s3][s5][s6][s2]',
  'fair-game':
    'As Jason, answer Bret Vogel\'s text after Coffee Break and meet him in Lummox County. Lucia does not get that text. Hunt the animals on his Target Deck (Map, Activities, Target Deck) and bring them back; 100% wants all 15 decks, a clean shot pays more but is not required, and which single animal flips the trophy is still being checked. [s3][s1][s2][s6]',
  'dont-touch-my-deck':
    'Finish any three collectible card sets. Guides map 18 sets in total. Two cards, Vicki and Victor Maravilla, sit in the Starlet Motel and leave with it at the Chapter 2 finale Checking Out, so pick those up while you still have the room. [s1][s3][s5]',
  'you-wainker':
    'Scan 100 world spots with the WAiNK app. Any 100 count, and the state has more than that, in groups such as landmarks, curiosities, sculptures, and No Flusher tags. Scanning vehicles is a different trophy. [s1][s3][s4]',
  'one-last-thing':
    'Complete 50 challenges under Progress, then Challenges, using the completed tick while you scroll. There are 80, and many fill in during other trophies, so pick the short ones you still have near the end. 100% asks for 70 of 80, so the bronze pops before that box is full. [s1][s3][s2][s6]',
  'hot-together':
    'After Coffee Break, call your partner and raise the wanted level to four stars, then leave the red heat zone rather than only the flashing search ring. A fast bike helps, and the train tunnel north of Ambrosia is one route because the helicopter loses you. Large bank vaults start at four stars and are required for 100%, so the pop often happens on that escape, but do it before the finale if the ending might split the pair. [s1][s2][s3][s5][s6]',
  'retail-therapy':
    'Call your partner and rob three shops in a row without letting the wanted level drop, staying in the flashing chase and not only the red heat zone. The pop lags about half a minute after the third shop, so hit a fourth if it stays quiet, and take a few items plus the back safe when you can. Three jewelry stores in north Vice City are a known route after Yasmani\'s Chapter 3 jobs, and pair work should be done before the finale if the ending might split the characters. [s1][s2][s3][s5]',
  'whip-it-good':
    'Discover 100 different vehicles by pointing WAiNK at traffic. You do not have to drive each one, boats and aircraft count, and the totals sit under Progress, Vehicles. 100% wants 200 of 277 base models, so this bronze arrives well before that box. [s1][s3][s2][s6]',
  'gunslinger':
    'While aiming a gun, trigger Combat Focus and drop five enemies before that one use ends. Fill the bar first with food, a wash, or Adrenaline, then use a full-auto rifle up close at a gang operation in body armor. Police, soldiers, and civilians are reported not to count, and the four Focus levels rise from ranges, golf, pool, fishing, and headshots, so the trophy gets easier later. [s1][s3][s2]',
  'catch-me-if-you-can':
    'At VCIA, take a large passenger jet that is still attached to a boarding bridge. Jets parked out on the field do not count. Gates E3 and E4 are the easy pair: stairs by the bridge, up to the cockpit, back onto the runway, then fly about a kilometer away because the pop is delayed, and save first because the police arrive quickly. [s1][s2][s3]',
  'challenging-tank':
    'Steal a military tank (the line about Rhinos is the hint) from the south side of Mile Zero Air Station, the island at the south-west edge of the map. Drive in through the gate or the stunt jump by the south-east entrance, get in, and fire on the soldiers until it pops. Save before you enter the base. [s1][s4][s2][s3]',
  'sneakthief':
    'Finish Yasmani\'s Jewelry Jobs in Chapter 3 so you own the Snap Gun and the stores are marked. Use the Snap Gun on the back door, because a kick sets off the alarm, then read the safe code, empty the safe, wipe the camera footage, and shut the alarm off. Richardson Jewelry and Diamonds in Vice City is a known quiet target, and the trophy pops shortly after you leave unseen, so reload if anyone spots you. [s2][s3][s1]',
  'maximum-withdrawal':
    'Do the Chapter 4 optional mission That\'s Where The Money Is, which teaches the vault job and counts as your first. After Yasmani\'s payday-loan work, pay him for security-van tips, follow the van, enter while the guard has the vault open, and hand a bag to your partner when you cannot carry more. Any five vaults unlock the silver, 100% wants all eight large-bank vaults, and leaving the red heat zone is part of the escape. [s2][s3][s1][s6]',
  'a-classic-blitz-play':
    'Rob an armored truck and get out of the red heat zone. Clearing a large-bank vault during That\'s Where The Money Is counts, because you tail the truck first, and an earlier route is to block a truck near a Vice City bank and blow the rear door with the sticky bombs from the back of Yasmani\'s shop. You will hit every large bank for 100%, so this bronze is hard to miss on that checklist. [s1][s2][s3][s6]',
  'the-goodtime-state':
    'Remove the black fog from the whole Leonida map. A plane is the quick way: fly over every dark patch until the map is fully drawn in. [s1][s3][s2]',
  'pest-control':
    'Rob one illegal operation from each of the nine gangs guides count. Yellow icons appear when you get close, some are marked by the story, and Progress, Gangs shows how many of that gang\'s sites you have hit. 100% wants all 39 operations, including their key valuables, so this bronze pops during that cleanup, and a missed valuable comes back only after a long wait. [s1][s2][s4][s3][s6]',
  'in-the-beginning':
    'Go to the rooftop bar on Ocean Beach (one write-up names the Ocean View Hotel: pool level, Rooftop Access, then the lift) and drink an Apple Martini at the bar with the view in front of you. Output Lag still files the trigger as unconfirmed at launch, so if the martini does not pop it, try the bar again rather than assuming a story flag. [s1][s4][s3][s2]',
  'capital-offense':
    'Get the key cloner from the Chapter 3 mission where you steal the Zorrusso for Randy. The filmed route uses the blue Banshee in the south Vice City showroom: hack it, drive forward, and go straight through the glass. The pop lands a little late, out on the street, and other cars in that room are reported not to count, so stick to the blue one while a second guide still marks the trigger unconfirmed. [s3][s1][s2]',
  'lets-go-bowling':
    'Kingpin Bowling in Port Gellhorn is the Kolt and Associates alley, marked by the Chapter 2 optional job Hit Kingpin Bowling. Take the luxury watch in the south-east office, the unique shotgun on the table in the north-east corner, and the safe in the north-east hallway (code 0300 or a sticky bomb), then escape the police after the third item. You can leave and come back when the robbery icon returns, so missing one item during the mission does not kill the trophy. [s2][s3][s4]',
  'personal-best':
    'Max out Strength on Jason and Lucia at the same time, watching the heart icon on each character page. Buy a gym membership and always call your partner first, because the partner trains while you do. Switching opens after Coffee Break, so finish the pair workouts before the last mission if an ending might limit who you can play. [s1][s3][s4][s2][s5]',
  'actions-speak-louder':
    'Log 500 actions that move your criminal profile, using the trophy counter and the optional HUD face so you can see what counts. Stealth finishes, limb shots, kills, and messy escapes feed different tiers, and robberies plus fights usually fill the total on a 100% run. If you are still short, driving through crowds is the fast farm, but stay out of the permanent Irredeemable tier if you can. [s1][s3][s2][s5]',
  'bad-luck-i-guess':
    'In the prologue Lucia robs a payday-loan store, and this trophy is for robbing that same store again. After Credit Check, go alone as Lucia, without Jason, to the payday loan in Little Cuba, clear the room, take all three drawers, and run away on foot until you leave the search area. Driving off is reported not to count, and Output Lag still lists the trigger as unconfirmed, so follow that on-foot route if a vaguer attempt fails. [s1][s3][s2]',
  'the-truth-is-out-there':
    'One filmed method is a night UFO north-west of the Starlet Motel in Kelly County after 2 a.m., going alone, and a blinking roadside car means the event can start. If the car is missing, leave and come back, then follow the woods toward the blue light, talk to the woman the craft drops, and walk her back to the car. A second guide still calls the trigger unconfirmed and also mentions a one-time graffiti code in a Crosstown stairwell, so try the motel road first and save before you hunt the blinking car. [s3][s4][s2]',
  'ten-pin':
    'Ride a motorcycle or a bicycle and knock down 10 pedestrians with a melee hit inside 60 seconds. Vice City sidewalks and the Ocean Beach boardwalk are the crowded spots, and a slow pass alongside people works better than full speed. Output Lag still lists this as unconfirmed, so if a car or a weapon swing does nothing, switch to a bike and count ten kicks. [s1][s3][s4][s2]',
  'dime-on-the-dollar':
    'Finish Credit Check so you have the dye-pack jammer, then sell marked bills from banks and payday-loan jobs to a fence. Yasmani in Vice City is listed as the best rate, and the $250,000 adds up across trips rather than one drop. Large vaults, after That\'s Where The Money Is, pay up to about $205,000 each, so a 100% robbery run covers this. [s2][s3][s1][s6]',
  'treat-yo-self':
    'Spend $100,000 in total across shops. Guns, car mods, and tattoos are the expensive shortcuts, and mod shops, Pay \'n\' Spray, Ammu-Nation, clothes, and salons all share one tally. Starting Tourist Trap at the end of Chapter 1 wipes the cash you are carrying, so buy weapons and clothes before that mission, because the purchases themselves stay with you. [s1][s2][s3][s5]',
  'little-boxes':
    'After Daily Driver, buy garages from the Vice City Real Estate app on the phone. Only the eight garages you purchase count. The four the story hands you do not, and the eight together cost about $160,000. [s2][s3][s1]',
  'on-the-spot':
    'The Scooter Bros app arrives with the Chapter 2 mission where you take a vehicle to Moses, and each registration needs a free garage space, so buy garages first. Drive an untracked stolen car to Moses in Port Gellhorn, then choose Respray and Register, using cheap cars to keep the fee down. From Chapter 3, cars with a standard tracker can also be registered at a Pay \'n\' Spray. [s1][s2][s3]',
};

const trophies = JSON.parse(readFileSync(path, 'utf8'));
if (!Array.isArray(trophies)) throw new Error('trophies.json must be an array');

const seen = new Set();
for (const trophy of trophies) {
  const id = trophy && trophy.id;
  if (typeof id !== 'string' || !guides[id]) throw new Error(`missing guide string for ${id}`);
  if (!trophy.guide || !Array.isArray(trophy.guide.steps) || trophy.guide.steps.length === 0) {
    throw new Error(`${id} has no guide.steps to move`);
  }
  const text = guides[id].trim();
  if (!text) throw new Error(`blank guide for ${id}`);
  trophy.walkthrough = trophy.guide;
  trophy.guide = text;
  seen.add(id);
}

for (const id of Object.keys(guides)) {
  if (!seen.has(id)) throw new Error(`guide string has no trophy: ${id}`);
}

writeFileSync(path, `${JSON.stringify(trophies, null, 2)}\n`);
console.log(`updated ${seen.size} trophies`);
