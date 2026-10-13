// =====================================================================
// STORY CONTENT — follows the packet in historical order.
// Every spoken line has an id; its voice file is assets/vo/<id>.mp3
// =====================================================================

// Who speaks with which voice (Higgsfield preset voice ids)
const CAST = {
  narr:     { name: 'Narrador',            voice: 'd603a8cd-3fe1-55e0-9245-617a2589131e' },
  zapata:   { name: 'Emiliano Zapata',     voice: '563f728c-e249-5a85-97ab-8461e8c09da6' },
  ninio:    { name: 'Emiliano (niño)',     voice: '0178ef57-ada4-43d9-992b-8d9221045bb4' },
  mama:     { name: 'Mamá',                voice: '75e72cd5-011b-4130-a474-e8b1ab341f04' },
  papa:     { name: 'Papá',                voice: 'ed69c516-92d2-4b30-a967-617737a342e5' },
  viejo:    { name: 'Don Chema',           voice: '1ad38ba4-9cc4-4f2f-9fde-b0fefdf67ae5' },
  campesina:{ name: 'Doña Lupe',           voice: '023ebf5e-1970-40d8-825c-a5ef6a1dd4ff' },
  campesino:{ name: 'Campesino',           voice: '549ff70a-3ee7-4f04-a4d9-89a24fab7709' },
  hacendado:{ name: 'El hacendado',        voice: 'dc382508-c8bd-443c-8cb2-46e57b8d2e6f' },
  capataz:  { name: 'El capataz',          voice: '858499d9-fef5-40e1-bc29-b4dc661dc283' },
  madero:   { name: 'Francisco I. Madero', voice: '95429266-c0ac-4137-a209-63b8812b0f23' },
  villa:    { name: 'Pancho Villa',        voice: '195e386a-cb61-5c1b-a53b-0e2f0669c408' },
  huerta:   { name: 'Victoriano Huerta',   voice: '6f98d3dd-324f-4845-8c28-c1d1647a06cd' },
  carranza: { name: 'Venustiano Carranza', voice: 'd9d5c263-f84e-4752-97b5-3750fcc6fd2f' },
  gonzalez: { name: 'Pablo González',      voice: '43173c95-3ec8-446a-a162-6504332c578b' },
  guajardo: { name: 'Jesús Guajardo',      voice: 'e5666b9c-99a2-4fac-8b4e-abee078b186d' },
  soldado:  { name: 'Soldado',             voice: 'ef70cc83-3015-4bad-9359-0ea968c43ec0' },
  maestra:  { name: 'La maestra',          voice: '75e72cd5-011b-4130-a474-e8b1ab341f04' },
  vecina:   { name: 'Vecina',              voice: '80924413-1ea8-4e64-9719-e00b86796f05' },
  guardia:  { name: 'Guardia',             voice: 'f1e8226e-2248-4d5f-b43c-0a79e9949dbf' },
  nina:     { name: 'Estudiante',          voice: '0178ef57-ada4-43d9-992b-8d9221045bb4' },
};

// Cutscene steps:
//  {card:[[es,en],...], vo}              black screen, white typewriter text
//  {scene:'theme', actors:[[who,x,face]]} set the stage (x in px, face 1 right / -1 left)
//  {say:who, es, en, vo}                 speech bubble + subtitle
//  {narr:es, en, vo}                     subtitle only
//  {walk:who, to:x}  {enter:who, from:'left'|'right', to:x}  {exit:who, to:'left'|'right'}
//  {jump:who} {fall:who} {shake:1} {wait:frames} {flag:who} (raises a banner)
const CHAPTERS = [
// ---------------------------------------------------------------- 1
{ id: 1, title: 'Anenecuilco', years: '1879', theme: 'village',
  cut: [
    { card: [['8 de agosto de 1879', 'August 8, 1879'], ['Anenecuilco, Morelos', 'Anenecuilco, Morelos (south of Mexico City)']], vo: 'c1a' },
    { scene: 'village', actors: [['papa', 520, 1], ['mama', 600, -1]] },
    { narr: 'Ese día nació Emiliano Zapata, en una familia campesina.', en: 'That day Emiliano Zapata was born, into a farming family.', vo: 'c1b' },
    { say: 'mama', es: 'Somos pobres, pero trabajamos nuestra tierra.', en: 'We are poor, but we work our land.', vo: 'c1c' },
    { enter: 'hacendado', from: 'right', to: 820 },
    { say: 'hacendado', es: 'Esta tierra ahora es de mi hacienda.', en: 'This land belongs to my hacienda now.', vo: 'c1d' },
    { say: 'papa', es: '¡Pero es la tierra del pueblo!', en: "But it's the town's land!", vo: 'c1e' },
    { say: 'hacendado', es: 'El presidente Porfirio Díaz me protege.', en: 'President Porfirio Díaz protects me.', vo: 'c1f' },
    { exit: 'hacendado', to: 'right' },
    { card: [['Los hacendados quitaban las tierras.', 'The rich landowners took the land.'], ['Y el dictador Porfirio Díaz los protegía.', 'And the dictator Porfirio Díaz protected them.']], vo: 'c1g' },
    { scene: 'village', actors: [['papa', 560, 1], ['ninio', 640, -1]] },
    { say: 'ninio', es: 'Cuando sea grande, voy a recuperar nuestras tierras.', en: "When I grow up, I'm going to get our land back.", vo: 'c1h' },
    { jump: 'ninio' },
  ],
  npcs: [
    { who: 'mama', lines: [['Naciste aquí, en Anenecuilco, el 8 de agosto de 1879.', 'You were born here, in Anenecuilco, on August 8, 1879.', 'n1a'], ["Somos campesinos. Trabajamos la tierra.", "We are farmers. We work the land.", 'n1b']] },
    { who: 'viejo', lines: [["Los hacendados tienen grandes haciendas de azúcar.", "The landowners have huge sugar haciendas.", 'n1c'], ['Nos quitan las tierras. Eso es un despojo.', 'They take our land. That is a "despojo" (land theft).', 'n1d']] },
    { who: 'hacendado', lines: [['Porfirio Díaz es el dictador. Él me protege.', 'Porfirio Díaz is the dictator. He protects me.', 'n1e'], ["Las tierras del pueblo ahora son mías.", "The town's land is mine now.", 'n1f']] },
  ],
  notes: [
    ['¿Quién fue Zapata?', 'Un líder campesino de la Revolución Mexicana.', 'A farmer leader of the Mexican Revolution.'],
    ['Nacimiento', 'Nació el 8 de agosto de 1879 en Anenecuilco, Morelos.', 'Born August 8, 1879 in Anenecuilco, Morelos.'],
    ['El problema', 'Los hacendados quitaban las tierras. Porfirio Díaz los protegía.', 'Landowners took the land. Porfirio Díaz protected them.'],
  ],
  gate: [
    { q: '¿Dónde nació Zapata?', en: 'Where was Zapata born?', o: ['Anenecuilco, Morelos', 'Ciudad de México', 'Chihuahua', 'Aguascalientes'], ex: 'Anenecuilco, en el estado de Morelos.' },
    { q: '¿Cuándo nació Zapata?', en: 'When was Zapata born?', o: ['8 de agosto de 1879', '10 de abril de 1919', '25 de noviembre de 1911', 'Diciembre de 1914'], ex: '1879. En 1919 murió.' },
    { q: '¿Quién protegía a los hacendados?', en: 'Who protected the landowners?', o: ['Porfirio Díaz', 'Pancho Villa', 'Zapata', 'Madero'], ex: 'El dictador Porfirio Díaz.' },
  ],
  battle: { name: 'Defiende el pueblo', size: 40, gaps: 0, hazard: 0, walkers: 2, flyers: 0, pads: 1, guns: ['shotgun'], boss: null, theme: 'village' },
  qs: [
    { q: '¿Cuál era el objetivo principal de la lucha de Emiliano Zapata?', en: "What was the main goal of Zapata's fight?", o: ['Devolver las tierras a los campesinos', 'Ser presidente de México', 'Construir ferrocarriles', 'Ayudar a los hacendados'], ex: 'Quería devolver la tierra a los campesinos.' },
    { q: '¿Qué son los campesinos?', en: 'What are campesinos?', o: ['Personas que trabajan la tierra', 'Dueños ricos de tierras', 'Soldados', 'Presidentes'], ex: 'Campesinos = farmers.' },
    { q: '¿Qué son los hacendados?', en: 'What are hacendados?', o: ['Dueños ricos de tierras', 'Campesinos', 'Maestros', 'Soldados'], ex: 'Hacendados = rich landowners.' },
    { q: '¿Dónde nació Zapata?', en: 'Where was Zapata born?', o: ['Anenecuilco, Morelos', 'Ciudad de México', 'Chihuahua', 'Aguascalientes'], ex: 'Anenecuilco, Morelos.' },
    { q: 'Zapata ___ en 1879. (nacer)', en: 'Zapata ___ in 1879. (to be born)', o: ['nació', 'nacía', 'nace', 'nacieron'], ex: 'Pasó una vez: pretérito. Él → nació.', v: [['nació', 'nacer', 'pretérito', 'was born']] },
    { q: '¿Qué es un despojo de tierras?', en: "What is a 'despojo de tierras'?", o: ['Quitar la tierra a alguien', 'Comprar tierra', 'Sembrar la tierra', 'Regalar tierra'], ex: 'Despojo = quitar (taking away).' },
  ],
  end: [['Zapata nació en 1879 en Anenecuilco, Morelos.', 'Zapata was born in 1879 in Anenecuilco, Morelos.'], ['Los hacendados les quitaban la tierra a los campesinos.', 'The landowners took land from the farmers.']], endVo: 'c1z',
},
// ---------------------------------------------------------------- 2
{ id: 2, title: 'El Consejo', years: '1909', theme: 'farm',
  cut: [
    { card: [['Septiembre de 1909', 'September 1909'], ['Anenecuilco', 'Anenecuilco']], vo: 'c2a' },
    { scene: 'farm', actors: [['viejo', 420, 1], ['campesina', 520, 1], ['zapata', 760, -1]] },
    { narr: 'Zapata ya era un hombre. La hacienda quería más tierra.', en: 'Zapata was a man now. The hacienda wanted more land.', vo: 'c2b' },
    { say: 'viejo', es: 'Necesitamos un líder. ¿Quién nos va a defender?', en: 'We need a leader. Who will defend us?', vo: 'c2c' },
    { say: 'campesina', es: '¡Emiliano! ¡Que sea Emiliano!', en: 'Emiliano! Let it be Emiliano!', vo: 'c2d' },
    { jump: 'campesina' },
    { narr: 'El pueblo eligió a Zapata presidente del Consejo Municipal.', en: 'The town elected Zapata president of the town council.', vo: 'c2e' },
    { walk: 'zapata', to: 660 },
    { say: 'zapata', es: 'Voy a defender nuestras tierras y recuperar las tierras confiscadas.', en: 'I will defend our land and get back the land they took.', vo: 'c2f' },
  ],
  npcs: [
    { who: 'viejo', lines: [["En 1909 el pueblo eligió a Zapata presidente del Consejo Municipal.", "In 1909 the town elected Zapata president of the town council.", 'n2a'], ["Su trabajo: defender y recuperar las tierras del pueblo.", "His job: defend and get back the town's land.", 'n2b']] },
    { who: 'campesina', lines: [['Su trabajo era defender las tierras.', 'His job was to defend the land.', 'n2c'], ["Y recuperar las tierras que nos quitaron.", "And get back the land they took from us.", 'n2d']] },
    { who: 'capataz', lines: [['Estas tierras fueron confiscadas.', 'This land was confiscated.', 'n2e'], ["Confiscadas quiere decir quitadas.", "Confiscated means taken away.", 'n2f']] },
  ],
  notes: [
    ['1909', 'El pueblo eligió a Zapata presidente del Consejo Municipal de Anenecuilco.', 'The town elected Zapata president of the Anenecuilco town council.'],
    ['Su trabajo', 'Defender las tierras y recuperar las tierras confiscadas.', 'Defend the land and get back the confiscated land.'],
    ['Palabras', 'Restituir = devolver. Confiscar = quitar.', 'Restituir = give back. Confiscar = take away.'],
  ],
  gate: [
    { q: '¿Qué cargo tuvo Zapata en 1909?', en: 'What job did Zapata have in 1909?', o: ['Presidente del Consejo Municipal', 'Presidente de México', 'General del ejército', 'Hacendado'], ex: 'Presidente del Consejo Municipal de Anenecuilco.' },
    { write: 2 },
  ],
  battle: { name: 'La hacienda', size: 48, gaps: .5, hazard: .3, walkers: 3, flyers: 0, pads: 2, guns: ['boomerang'], boss: null, theme: 'farm' },
  qs: [
    { q: '¿Qué cargo ocupó Zapata en 1909?', en: 'What position did Zapata hold in 1909?', o: ['Presidente del Consejo Municipal de Anenecuilco', 'Presidente de México', 'Gobernador de Morelos', 'General'], ex: 'Consejo Municipal = town council.' },
    { q: '¿Cuál era su trabajo en el Consejo?', en: 'What was his job on the council?', o: ['Defender las tierras del pueblo', 'Vender tierras', 'Cobrar impuestos', 'Construir casas'], ex: 'Defender y recuperar las tierras.' },
    { q: 'En 1909 Zapata ___ presidente del Consejo. (ser elegido)', en: 'In 1909 Zapata ___ council president. (was elected)', o: ['fue elegido', 'era elegido', 'es elegido', 'fueron elegidos'], ex: 'Pasó una vez: fue elegido.', v: [['fue elegido', 'elegir', 'pasiva', 'was elected']] },
    { q: '¿Qué significa "restituir"?', en: "What does 'restituir' mean?", o: ['Devolver', 'Quitar', 'Vender', 'Romper'], ex: 'Restituir = devolver = give back.' },
    { q: 'Los hacendados ___ las tierras. (quitar)', en: 'The landowners ___ the land. (took)', o: ['quitaron', 'quitó', 'quitamos', 'quitas'], ex: 'Ellos + pasado: quitaron.', v: [['quitaron', 'quitar', 'pretérito', 'took away']] },
    { q: 'Yo ___ la tierra. (trabajar, presente)', en: 'I ___ the land. (work)', o: ['trabajo', 'trabaja', 'trabajamos', 'trabajan'], ex: 'Yo → -o: trabajo.', v: [['trabajo', 'trabajar', 'presente', 'I work']] },
  ],
  end: [['En 1909 Zapata fue presidente del Consejo Municipal.', 'In 1909 Zapata was president of the town council.'], ['Su trabajo era defender las tierras del pueblo.', "His job was to defend the town's land."]], endVo: 'c2z',
},
// ---------------------------------------------------------------- 3
{ id: 3, title: 'Tierra y Libertad', years: '1910–1911', theme: 'desert',
  cut: [
    { card: [['1910', '1910'], ['Empieza la Revolución Mexicana', 'The Mexican Revolution begins']], vo: 'c3a' },
    { scene: 'desert', actors: [['madero', 460, 1], ['zapata', 640, -1], ['soldado', 740, -1]] },
    { say: 'madero', es: '¡Basta de dictadura! Vamos a quitar a Porfirio Díaz.', en: "Enough dictatorship! Let's remove Porfirio Díaz.", vo: 'c3b' },
    { say: 'zapata', es: 'Te ayudo. Mis campesinos son el Ejército Liberador del Sur.', en: 'I will help you. My farmers are the Liberating Army of the South.', vo: 'c3c' },
    { narr: 'Ganaron. Madero llegó a la presidencia.', en: 'They won. Madero became president.', vo: 'c3d' },
    { card: [['1911', '1911'], ['Pero Madero no devolvió las tierras.', 'But Madero did not give the land back.']], vo: 'c3e' },
    { scene: 'desert', actors: [['madero', 480, 1], ['zapata', 620, -1]] },
    { say: 'zapata', es: 'Presidente, devuelva las tierras a los campesinos. ¡Ya!', en: 'President, give the land back to the farmers. Now!', vo: 'c3f' },
    { say: 'madero', es: 'Paciencia, Emiliano. Más tarde.', en: 'Patience, Emiliano. Later.', vo: 'c3g' },
    { say: 'zapata', es: 'No. Rompo con usted.', en: 'No. I am breaking with you.', vo: 'c3h' },
    { exit: 'zapata', to: 'right' },
    { card: [['25 de noviembre de 1911', 'November 25, 1911'], ['El Plan de Ayala', 'The Plan de Ayala']], vo: 'c3i' },
    { scene: 'desert', actors: [['zapata', 620, 1], ['campesino', 480, 1], ['soldado', 780, -1]] },
    { flag: 'zapata' },
    { say: 'zapata', es: 'Este es el Plan de Ayala. Nuestro lema: ¡Tierra y Libertad!', en: 'This is the Plan de Ayala. Our motto: Land and Liberty!', vo: 'c3j' },
    { narr: 'El plan pedía devolver las tierras y quitar una tercera parte de las tierras de los hacendados.', en: "The plan demanded giving land back and taking one third of the landowners' land.", vo: 'c3k' },
  ],
  npcs: [
    { who: 'soldado', lines: [['Somos el Ejército Liberador del Sur.', 'We are the Liberating Army of the South.', 'n3a'], ["Somos campesinos del sur de México.", "We are farmers from southern Mexico.", 'n3b']] },
    { who: 'viejo', lines: [["El Plan de Ayala pide devolver las tierras y quitar una tercera parte a los hacendados.", "The Plan de Ayala demands giving land back and taking one third from the landowners.", 'n3c'], ["Madero no devolvió las tierras. Por eso Zapata rompió con él.", "Madero didn't give the land back. That's why Zapata broke with him.", 'n3d']] },
    { who: 'campesino', lines: [["Tierra y Libertad.", "Land and Liberty.", 'n3e'], ['Para nosotros es tener tierra propia y ser libres.', 'For us it means having our own land and being free.', 'n3f']] },
  ],
  notes: [
    ['1910', 'Madero empezó la Revolución contra Porfirio Díaz. Zapata lo ayudó.', 'Madero started the Revolution against Díaz. Zapata helped him.'],
    ['La ruptura', 'Zapata rompió con Madero porque Madero no devolvió las tierras.', "Zapata broke with Madero because Madero didn't give the land back."],
    ['Plan de Ayala (1911)', 'Lema: Tierra y Libertad. Pedía devolver tierras y quitar 1/3 a los hacendados.', 'Motto: Land and Liberty. Demanded land back and 1/3 of landowners\' land.'],
  ],
  gate: [
    { q: '¿Cómo se llamaba el ejército de Zapata?', en: "What was Zapata's army called?", o: ['Ejército Liberador del Sur', 'División del Norte', 'Ejército Constitucionalista', 'Guardia Nacional'], ex: 'Del Sur, porque eran del sur.' },
    { write: 1 },
    { write: 0 },
  ],
  battle: { name: 'El camino a Ayala', size: 56, gaps: .6, hazard: .4, walkers: 3, flyers: 1, pads: 2, movers: 1, saws: 1, guns: ['bomb'], boss: null, theme: 'desert' },
  qs: [
    { q: '¿Qué documento redactó Zapata en noviembre de 1911 tras romper alianzas con Francisco I. Madero?', en: 'What document did Zapata write in November 1911 after breaking with Madero?', o: ['El Plan de Ayala', 'El Plan de San Luis', 'La Constitución de 1917', 'El Plan de Guadalupe'], ex: 'Plan de Ayala. El Plan de San Luis era de Madero.' },
    { q: '¿Cómo se llamaba el ejército de campesinos liderado por Zapata en el sur de México?', en: 'What was the name of the farmer army led by Zapata in the south?', o: ['Ejército Liberador del Sur', 'Ejército Constitucionalista', 'División del Norte', 'Guardia Nacional del Sur'], ex: 'Ejército Liberador del Sur. La División del Norte era de Villa.' },
    { q: '¿Cuál era el lema del Plan de Ayala?', en: 'What was the motto of the Plan de Ayala?', o: ['Tierra y Libertad', 'Orden y Progreso', 'Pan y Paz', 'Viva México'], ex: 'Tierra y Libertad = Land and Liberty.' },
    { q: '¿Por qué Zapata rompió con Madero?', en: 'Why did Zapata break with Madero?', o: ['Madero no devolvió las tierras', 'Madero se fue del país', 'Madero era su enemigo desde niño', 'Madero se unió a Villa'], ex: 'Madero no devolvió las tierras a los campesinos.' },
    { q: '¿Qué parte de las tierras de los hacendados pedía el plan?', en: "What part of the landowners' land did the plan ask for?", o: ['Una tercera parte', 'La mitad', 'Toda', 'Nada'], ex: 'Una tercera parte = 1/3.' },
    { q: 'Zapata ___ con Madero en 1911. (romper)', en: 'Zapata ___ with Madero in 1911. (broke)', o: ['rompió', 'rompía', 'rompe', 'rompieron'], ex: 'Una vez, él: rompió.', v: [['rompió', 'romper', 'pretérito', 'broke']] },
    { q: 'Nosotros ___ por la tierra. (luchar, presente)', en: 'We ___ for the land. (fight)', o: ['luchamos', 'lucho', 'luchan', 'lucha'], ex: 'Nosotros → -amos: luchamos.', v: [['luchamos', 'luchar', 'presente', 'we fight']] },
  ],
  end: [['Zapata rompió con Madero porque no devolvió las tierras.', "Zapata broke with Madero because he didn't give the land back."], ['En 1911 hizo el Plan de Ayala: Tierra y Libertad.', 'In 1911 he made the Plan de Ayala: Land and Liberty.']], endVo: 'c3z',
},
// ---------------------------------------------------------------- 4
{ id: 4, title: 'Contra Huerta', years: '1913–1914', theme: 'forest',
  cut: [
    { card: [['1913', '1913'], ['Golpe de Estado', 'A coup']], vo: 'c4a' },
    { scene: 'forest', actors: [['huerta', 640, -1], ['soldado', 760, -1]] },
    { narr: 'Victoriano Huerta tomó el poder con un golpe de Estado.', en: 'Victoriano Huerta took power with a coup.', vo: 'c4b' },
    { say: 'huerta', es: 'Ahora yo mando. Soy el nuevo dictador.', en: "Now I'm in charge. I am the new dictator.", vo: 'c4c' },
    { scene: 'forest', actors: [['zapata', 520, 1], ['villa', 660, -1], ['carranza', 790, -1]] },
    { say: 'zapata', es: 'Otro dictador. Vamos a luchar contra él.', en: "Another dictator. Let's fight him.", vo: 'c4d' },
    { say: 'villa', es: 'Desde el norte, yo también lucho contra Huerta.', en: 'From the north, I fight Huerta too.', vo: 'c4e' },
    { say: 'carranza', es: 'Y yo. Por ahora somos aliados.', en: 'Me too. For now we are allies.', vo: 'c4f' },
    { card: [['Zapata, Villa y Carranza', 'Zapata, Villa and Carranza'], ['se unieron contra Huerta.', 'joined together against Huerta.']], vo: 'c4g' },
  ],
  npcs: [
    { who: 'soldado', lines: [['Golpe de Estado: tomar el poder con el ejército.', 'A coup: taking power with the army.', 'n4a'], ["Huerta hizo eso en 1913.", "Huerta did that in 1913.", 'n4b']] },
    { who: 'campesino', lines: [['Villa lucha en el norte. Zapata, en el sur.', 'Villa fights in the north. Zapata, in the south.', 'n4c'], ["Juntos contra Huerta.", "Together against Huerta.", 'n4d']] },
    { who: 'vecina', lines: [['Zapata, Villa y Carranza fueron aliados por un tiempo.', 'Zapata, Villa and Carranza were allies for a while.', 'n4e'], ["Después se pelearon.", "Later they fought each other.", 'n4f']] },
  ],
  notes: [
    ['1913', 'Victoriano Huerta tomó el poder con un golpe de Estado.', 'Huerta took power with a coup.'],
    ['Aliados', 'Zapata luchó contra Huerta con Villa y Carranza.', 'Zapata fought Huerta with Villa and Carranza.'],
    ['Norte y sur', 'Villa era del norte. Zapata era del sur.', 'Villa was from the north. Zapata from the south.'],
  ],
  gate: [
    { q: '¿Cómo tomó el poder Huerta?', en: 'How did Huerta take power?', o: ['Con un golpe de Estado', 'Ganó una elección', 'Lo eligió Zapata', 'Compró el país'], ex: 'Golpe de Estado = coup.' },
    { q: '¿Con quién se unió Zapata contra Huerta?', en: 'Who did Zapata join against Huerta?', o: ['Villa y Carranza', 'Porfirio Díaz', 'Los hacendados', 'Guajardo'], ex: 'Con Villa y Carranza, por un tiempo.' },
    { q: '¿De dónde era Pancho Villa?', en: 'Where was Pancho Villa from?', o: ['Del norte', 'Del sur', 'De Morelos', 'De Anenecuilco'], ex: 'Villa = norte. Zapata = sur.' },
  ],
  battle: { name: 'Contra la dictadura', size: 64, gaps: .6, hazard: .5, walkers: 3, flyers: 2, pads: 2, movers: 2, saws: 1, guns: ['shotgun', 'sniper'], boss: { name: 'HUERTA', who: 'huerta', hp: 30, armor: 0 }, theme: 'forest', crates: 1 },
  qs: [
    { q: '¿Contra quién luchó Zapata en 1913?', en: 'Who did Zapata fight in 1913?', o: ['Victoriano Huerta', 'Pancho Villa', 'Porfirio Díaz', 'Madero'], ex: 'Contra el dictador Huerta.' },
    { q: '¿Qué es un golpe de Estado?', en: "What is a 'golpe de Estado'?", o: ['Tomar el poder con el ejército', 'Una elección', 'Una fiesta', 'Una ley de tierras'], ex: 'Golpe de Estado = coup.' },
    { q: '¿Quiénes fueron aliados contra Huerta?', en: 'Who were allies against Huerta?', o: ['Zapata, Villa y Carranza', 'Zapata y Díaz', 'Huerta y Villa', 'Madero y Huerta'], ex: 'Zapata, Villa y Carranza.' },
    { q: 'Huerta ___ el poder en 1913. (tomar)', en: 'Huerta ___ power in 1913. (took)', o: ['tomó', 'tomaba', 'toma', 'tomaron'], ex: 'Él, una vez: tomó.', v: [['tomó', 'tomar', 'pretérito', 'took']] },
    { q: 'Villa ___ en el norte. (luchar, imperfecto)', en: 'Villa ___ in the north. (was fighting)', o: ['luchaba', 'luchó', 'lucha', 'luchará'], ex: 'Algo que pasaba: luchaba.', v: [['luchaba', 'luchar', 'imperfecto', 'was fighting']] },
    { q: '¿Qué quiere decir "aliados"?', en: "What does 'aliados' mean?", o: ['Amigos que luchan juntos', 'Enemigos', 'Hacendados', 'Presidentes'], ex: 'Aliados = allies.' },
  ],
  end: [['En 1913 Huerta tomó el poder con un golpe de Estado.', 'In 1913 Huerta took power with a coup.'], ['Zapata luchó contra él con Villa y Carranza.', 'Zapata fought him with Villa and Carranza.']], endVo: 'c4z',
},
// ---------------------------------------------------------------- 5
{ id: 5, title: 'La Convención', years: '1914', theme: 'city',
  cut: [
    { card: [['1914', '1914'], ['Huerta pierde', 'Huerta loses']], vo: 'c5a' },
    { scene: 'desert', actors: [['zapata', 460, 1], ['villa', 580, 1], ['carranza', 800, -1]] },
    { narr: 'Huerta perdió. Pero los revolucionarios empezaron a pelear entre ellos.', en: 'Huerta lost. But the revolutionaries started fighting each other.', vo: 'c5b' },
    { say: 'carranza', es: 'Yo voy a ser el jefe.', en: "I'm going to be the boss.", vo: 'c5c' },
    { say: 'villa', es: 'Zapata, tú y yo vamos juntos.', en: 'Zapata, you and I go together.', vo: 'c5d' },
    { exit: 'carranza', to: 'right' },
    { narr: 'En la Convención de Aguascalientes se aprobaron grandes reformas de la tierra.', en: 'At the Convention of Aguascalientes, big land reforms were approved.', vo: 'c5e' },
    { card: [['Diciembre de 1914', 'December 1914'], ['Ciudad de México', 'Mexico City']], vo: 'c5f' },
    { scene: 'city', actors: [['vecina', 900, -1], ['campesino', 980, -1]] },
    { enter: 'zapata', from: 'left', to: 520 },
    { enter: 'villa', from: 'left', to: 420 },
    { narr: 'Zapata y Villa entraron juntos a la Ciudad de México.', en: 'Zapata and Villa entered Mexico City together.', vo: 'c5g' },
    { say: 'zapata', es: 'La tierra es de quien la trabaja.', en: 'The land belongs to those who work it.', vo: 'c5h' },
    { jump: 'vecina' },
  ],
  npcs: [
    { who: 'campesino', lines: [["En Aguascalientes hubo una gran reunión: la Convención.", "In Aguascalientes there was a big meeting: the Convention.", 'n5a'], ["En la Convención de Aguascalientes se aprobaron reformas de la tierra.", "At the Aguascalientes Convention, land reforms were approved.", 'n5b']] },
    { who: 'vecina', lines: [['En diciembre de 1914 llegaron Zapata y Villa.', 'In December 1914 Zapata and Villa arrived.', 'n5c'], ["¡Entraron a la capital!", "They entered the capital!", 'n5d']] },
    { who: 'soldado', lines: [['Ahora Carranza es enemigo de Zapata y Villa.', 'Now Carranza is the enemy of Zapata and Villa.', 'n5e'], ["Los aliados se pelearon.", "The allies fought each other.", 'n5f']] },
  ],
  notes: [
    ['Fricciones', 'Después de Huerta, los revolucionarios se pelearon.', 'After Huerta, the revolutionaries fought each other.'],
    ['La Convención', 'En la Convención de Aguascalientes aprobaron reformas de la tierra.', 'At the Aguascalientes Convention they approved land reforms.'],
    ['Diciembre de 1914', 'Zapata y Villa entraron a la Ciudad de México.', 'Zapata and Villa entered Mexico City.'],
  ],
  gate: [
    { q: '¿En qué año tomaron la Ciudad de México Zapata y Villa?', en: 'In what year did Zapata and Villa take Mexico City?', o: ['1914', '1909', '1911', '1919'], ex: 'Diciembre de 1914.' },
    { q: '¿Dónde fue la Convención?', en: 'Where was the Convention?', o: ['Aguascalientes', 'Chinameca', 'Anenecuilco', 'Chihuahua'], ex: 'La Convención de Aguascalientes.' },
    { q: '¿Con quién entró Zapata a la capital?', en: 'Who entered the capital with Zapata?', o: ['Pancho Villa', 'Carranza', 'Huerta', 'Díaz'], ex: 'Con Villa.' },
  ],
  battle: { name: 'La capital', size: 70, gaps: .7, hazard: .6, walkers: 3, flyers: 2, pads: 3, movers: 2, saws: 2, guns: ['sniper', 'bomb'], boss: null, theme: 'city', crates: 2, chests: 1 },
  qs: [
    { q: '¿En qué año tomaron la Ciudad de México las fuerzas de Emiliano Zapata y Pancho Villa?', en: 'In what year did Zapata and Villa take Mexico City?', o: ['1914', '1909', '1911', '1919'], ex: '1914, en diciembre.' },
    { q: '¿Dónde se aprobaron las reformas de la tierra?', en: 'Where were the land reforms approved?', o: ['En la Convención de Aguascalientes', 'En Chinameca', 'En el Plan de San Luis', 'En Anenecuilco'], ex: 'Convención de Aguascalientes.' },
    { q: '¿Qué pasó después de que cayó Huerta?', en: 'What happened after Huerta fell?', o: ['Los revolucionarios se pelearon', 'Todos fueron amigos', 'Volvió Díaz', 'Zapata se fue a vivir al norte'], ex: 'Hubo fricciones entre ellos.' },
    { q: 'Zapata y Villa ___ la capital. (tomar)', en: 'Zapata and Villa ___ the capital. (took)', o: ['tomaron', 'tomó', 'tomamos', 'tomaste'], ex: 'Ellos, una vez: tomaron.', v: [['tomaron', 'tomar', 'pretérito', 'they took']] },
    { q: 'La gente ___ muy feliz. (estar, imperfecto)', en: 'The people ___ very happy. (were)', o: ['estaba', 'estuvo', 'está', 'estarán'], ex: 'Descripción en el pasado: estaba.', v: [['estaba', 'estar', 'imperfecto', 'was']] },
    { q: '¿Quién se volvió enemigo de Zapata?', en: "Who became Zapata's enemy?", o: ['Carranza', 'Villa', 'Madero', 'Los campesinos'], ex: 'Carranza.' },
  ],
  end: [['En diciembre de 1914 Zapata y Villa tomaron la Ciudad de México.', 'In December 1914 Zapata and Villa took Mexico City.'], ['En la Convención de Aguascalientes aprobaron reformas de la tierra.', 'At the Aguascalientes Convention they approved land reforms.']], endVo: 'c5z',
},
// ---------------------------------------------------------------- 6
{ id: 6, title: 'Morelos', years: '1915–1918', theme: 'village',
  cut: [
    { card: [['1915', '1915'], ['Morelos', 'Morelos']], vo: 'c6a' },
    { scene: 'village', actors: [['zapata', 560, 1], ['maestra', 700, -1], ['campesina', 800, -1]] },
    { narr: 'Zapata regresó a Morelos e hizo un gobierno de campesinos.', en: 'Zapata returned to Morelos and made a farmers\' government.', vo: 'c6b' },
    { say: 'zapata', es: 'Vamos a repartir la tierra, abrir escuelas y crear cooperativas.', en: "We'll share out the land, open schools and create cooperatives.", vo: 'c6c' },
    { say: 'maestra', es: '¡Ahora los niños pueden estudiar!', en: 'Now the children can study!', vo: 'c6d' },
    { card: [['Pero Venustiano Carranza', 'But Venustiano Carranza'], ['no quería a Zapata.', 'did not want Zapata around.']], vo: 'c6e' },
    { scene: 'forest', actors: [['carranza', 600, 1], ['soldado', 720, -1], ['gonzalez', 480, 1]] },
    { say: 'carranza', es: 'Zapata es un problema. ¡Persíganlo!', en: 'Zapata is a problem. Chase him!', vo: 'c6f' },
    { narr: 'Las fuerzas de Carranza persiguieron a Zapata por años.', en: "Carranza's forces chased Zapata for years.", vo: 'c6g' },
  ],
  npcs: [
    { who: 'maestra', lines: [['Zapata abrió escuelas en Morelos.', 'Zapata opened schools in Morelos.', 'n6a'], ["Aquí aprenden los niños.", "Children learn here.", 'n6b']] },
    { who: 'campesina', lines: [['Una cooperativa es trabajar juntos.', 'A cooperative means working together.', 'n6c'], ["Repartimos la tierra entre todos.", "We share the land among everyone.", 'n6d']] },
    { who: 'soldado', lines: [['Los soldados de Carranza nos persiguen.', "Carranza's soldiers are chasing us.", 'n6e'], ["Se llaman constitucionalistas.", "They are called constitutionalists.", 'n6f']] },
  ],
  notes: [
    ['Gobierno campesino', 'Zapata hizo un gobierno de campesinos en Morelos.', 'Zapata made a farmers\' government in Morelos.'],
    ['Lo que hizo', 'Repartió tierras, abrió escuelas y creó cooperativas.', 'He shared out land, opened schools, made cooperatives.'],
    ['El enemigo', 'Las fuerzas de Carranza persiguieron a Zapata.', "Carranza's forces chased Zapata."],
  ],
  gate: [
    { q: '¿Qué hizo Zapata en Morelos?', en: 'What did Zapata do in Morelos?', o: ['Repartió tierras y abrió escuelas', 'Construyó un palacio', 'Vendió las tierras', 'Se hizo hacendado'], ex: 'Tierras, escuelas y cooperativas.' },
    { q: '¿Quién persiguió a Zapata?', en: 'Who chased Zapata?', o: ['Las fuerzas de Carranza', 'Pancho Villa', 'Madero', 'Los campesinos'], ex: 'Carranza y los constitucionalistas.' },
    { q: '¿Qué es una cooperativa?', en: 'What is a cooperative?', o: ['Trabajar juntos', 'Una escuela', 'Un ejército', 'Una hacienda'], ex: 'Cooperativa = working together.' },
  ],
  battle: { name: 'La persecución', size: 76, gaps: .7, hazard: .7, walkers: 4, flyers: 2, pads: 3, movers: 3, saws: 2, guns: ['bomb', 'boomerang', 'shotgun'], boss: { name: 'CARRANZA', who: 'carranza', hp: 40, armor: 20, ring: true }, theme: 'forest', crates: 2, stars: 2, chests: 1 },
  qs: [
    { q: '¿Qué hizo Zapata al regresar a Morelos?', en: 'What did Zapata do when he returned to Morelos?', o: ['Hizo un gobierno de campesinos', 'Se fue de México', 'Se unió a Huerta', 'Vendió su tierra'], ex: 'Un gobierno autónomo de campesinos.' },
    { q: '¿Qué abrió Zapata para los niños?', en: 'What did Zapata open for children?', o: ['Escuelas', 'Bancos', 'Haciendas', 'Cárceles'], ex: 'Escuelas.' },
    { q: '¿Quién era el enemigo de Zapata en 1915?', en: "Who was Zapata's enemy in 1915?", o: ['Venustiano Carranza', 'Pancho Villa', 'Madero', 'Porfirio Díaz'], ex: 'Carranza.' },
    { q: '¿Cómo se llamaban las fuerzas de Carranza?', en: "What were Carranza's forces called?", o: ['Constitucionalistas', 'Ejército Liberador del Sur', 'División del Norte', 'Zapatistas'], ex: 'Constitucionalistas.' },
    { q: 'Zapata ___ la tierra entre todos. (repartir)', en: 'Zapata ___ the land among everyone. (shared out)', o: ['repartió', 'repartía', 'reparto', 'repartieron'], ex: 'Él, una vez: repartió.', v: [['repartió', 'repartir', 'pretérito', 'shared out']] },
    { q: 'Los niños ___ en la escuela. (estudiar, imperfecto)', en: 'The kids ___ at school. (used to study)', o: ['estudiaban', 'estudió', 'estudio', 'estudiamos'], ex: 'Ellos, algo que pasaba: estudiaban.', v: [['estudiaban', 'estudiar', 'imperfecto', 'used to study']] },
  ],
  end: [['En Morelos, Zapata repartió tierras y abrió escuelas.', 'In Morelos, Zapata shared out land and opened schools.'], ['Carranza y sus fuerzas lo persiguieron.', 'Carranza and his forces chased him.']], endVo: 'c6z',
},
// ---------------------------------------------------------------- 7
{ id: 7, title: 'Chinameca', years: '1919', theme: 'night',
  cut: [
    { card: [['1919', '1919']], vo: 'c7a' },
    { scene: 'night', actors: [['gonzalez', 560, 1], ['guajardo', 680, -1]] },
    { say: 'gonzalez', es: 'Coronel Guajardo, tengo un plan para atrapar a Zapata.', en: 'Colonel Guajardo, I have a plan to catch Zapata.', vo: 'c7b' },
    { say: 'guajardo', es: 'Le voy a prometer armas y municiones.', en: "I'll promise him weapons and ammunition.", vo: 'c7c' },
    { narr: 'Pablo González planeó la trampa. Jesús Guajardo la hizo.', en: 'Pablo González planned the trap. Jesús Guajardo carried it out.', vo: 'c7d' },
    { card: [['10 de abril de 1919', 'April 10, 1919'], ['Hacienda de San Juan Chinameca', 'Hacienda de San Juan Chinameca']], vo: 'c7e' },
    { scene: 'night', actors: [['guajardo', 760, -1], ['soldado', 860, -1]] },
    { enter: 'zapata', from: 'left', to: 560 },
    { say: 'guajardo', es: 'Bienvenido, general. Aquí están sus armas.', en: 'Welcome, general. Here are your weapons.', vo: 'c7f' },
    { say: 'zapata', es: 'Gracias, coronel.', en: 'Thank you, colonel.', vo: 'c7g' },
    { shake: 1 },
    { fall: 'zapata' },
    { narr: 'Fue una emboscada. Zapata fue asesinado a tiros.', en: 'It was an ambush. Zapata was shot and killed.', vo: 'c7h' },
    { card: [['Zapata murió.', 'Zapata died.'], ['Pero sus ideas no.', 'But his ideas did not.']], vo: 'c7i' },
  ],
  npcs: [
    { who: 'soldado', lines: [["Guajardo dice que quiere unirse a Zapata.", "Guajardo says he wants to join Zapata.", 'n7a'], ["Guajardo le va a dar armas y municiones a Zapata.", "Guajardo is going to give Zapata weapons and ammo.", 'n7b']] },
    { who: 'viejo', lines: [['Cuidado, general. Puede ser una trampa.', 'Careful, general. It could be a trap.', 'n7c'], ["Una emboscada.", "An ambush.", 'n7d']] },
    { who: 'campesina', lines: [['La hacienda se llama San Juan Chinameca.', 'The hacienda is called San Juan Chinameca.', 'n7e'], ["Está en Morelos.", "It is in Morelos.", 'n7f']] },
  ],
  notes: [
    ['La trampa', 'Pablo González planeó la emboscada. Jesús Guajardo la hizo.', 'González planned the ambush. Guajardo carried it out.'],
    ['El engaño', 'Engañaron a Zapata con la promesa de armas y municiones.', 'They tricked Zapata with a promise of weapons and ammo.'],
    ['10 de abril de 1919', 'Zapata fue asesinado en la Hacienda de San Juan Chinameca.', 'Zapata was killed at the Hacienda de San Juan Chinameca.'],
  ],
  gate: [
    { q: '¿Quién planeó la emboscada?', en: 'Who planned the ambush?', o: ['Pablo González', 'Jesús Guajardo', 'Pancho Villa', 'Madero'], ex: 'González planeó. Guajardo la hizo.' },
    { write: 3 },
  ],
  battle: { name: 'La emboscada', size: 72, gaps: .8, hazard: .8, walkers: 3, flyers: 3, pads: 3, movers: 3, saws: 3, guns: ['shotgun', 'sniper', 'bomb'], boss: { name: 'GUAJARDO', who: 'guajardo', hp: 40, armor: 25, hard: true }, theme: 'night', crates: 2, stars: 2, chests: 2 },
  qs: [
    { q: '¿En qué lugar fue asesinado Emiliano Zapata el 10 de abril de 1919?', en: 'Where was Zapata killed on April 10, 1919?', o: ['En la Hacienda de San Juan Chinameca', 'En el Consejo Municipal de Anenecuilco', 'En la Convención de Aguascalientes', 'En el Palacio Nacional de la Ciudad de México'], ex: 'Hacienda de San Juan Chinameca, Morelos.' },
    { q: '¿Cómo engañaron a Zapata?', en: 'How did they trick Zapata?', o: ['Con la promesa de armas y municiones', 'Con una carta falsa', 'Con una fiesta', 'Con dinero'], ex: 'Armas y municiones = weapons and ammo.' },
    { q: '¿Quién hizo la emboscada?', en: 'Who carried out the ambush?', o: ['Jesús Guajardo', 'Pablo González', 'Carranza', 'Villa'], ex: 'Guajardo la ejecutó. González la planeó.' },
    { q: '¿Qué es una emboscada?', en: "What is an 'emboscada'?", o: ['Un ataque sorpresa', 'Una fiesta', 'Una ley', 'Un ejército'], ex: 'Emboscada = ambush.' },
    { q: 'Zapata ___ en 1919. (morir)', en: 'Zapata ___ in 1919. (died)', o: ['murió', 'moría', 'muere', 'morimos'], ex: 'Morir es irregular: murió.', v: [['murió', 'morir', 'pretérito', 'died']] },
    { q: 'González ya ___ la trampa. (planear, pluscuamperfecto)', en: 'González ___ the trap. (had planned)', o: ['había planeado', 'ha planeado', 'planeaba', 'planea'], ex: 'Había + -ado: había planeado.', v: [['había planeado', 'planear', 'pluscuamperfecto', 'had planned']] },
  ],
  end: [['El 10 de abril de 1919 Zapata fue asesinado en Chinameca.', 'On April 10, 1919 Zapata was killed at Chinameca.'], ['Lo engañaron con la promesa de armas y municiones.', 'They tricked him with a promise of weapons and ammo.']], endVo: 'c7z',
},
// ---------------------------------------------------------------- 8
{ id: 8, title: 'El legado', years: 'Hoy', theme: 'sky',
  cut: [
    { card: [['1917', '1917'], ['La Constitución Mexicana', 'The Mexican Constitution']], vo: 'c8a' },
    { scene: 'sky', actors: [['maestra', 540, 1], ['nina', 680, -1]] },
    { say: 'maestra', es: 'Las ideas de Zapata inspiraron el Artículo 27 de la Constitución de 1917.', en: "Zapata's ideas inspired Article 27 of the 1917 Constitution.", vo: 'c8b' },
    { say: 'nina', es: '¿Qué dice el Artículo 27?', en: 'What does Article 27 say?', vo: 'c8c' },
    { say: 'maestra', es: 'Habla de la propiedad de la tierra.', en: 'It is about who owns the land.', vo: 'c8d' },
    { card: [['Hoy', 'Today']], vo: 'c8e' },
    { scene: 'sky', actors: [['campesino', 500, 1], ['campesina', 620, 1], ['viejo', 740, -1]] },
    { say: 'campesino', es: 'Zapata es un símbolo para los campesinos y los pueblos indígenas.', en: 'Zapata is a symbol for farmers and Indigenous peoples.', vo: 'c8f' },
    { flag: 'campesino' },
    { narr: '¡Tierra y Libertad!', en: 'Land and Liberty!', vo: 'c8g' },
  ],
  npcs: [
    { who: 'maestra', lines: [["El Artículo 27 de la Constitución de 1917 habla de la tierra.", "Article 27 of the 1917 Constitution is about the land.", 'n8a'], ["Habla de la propiedad de la tierra.", "It is about who owns the land.", 'n8b']] },
    { who: 'nina', lines: [["Hoy mucha gente recuerda a Zapata.", "Today many people remember Zapata.", 'n8c'], ["Zapata es una bandera para los movimientos campesinos e indígenas.", "Zapata is a flag for farmer and Indigenous movements.", 'n8d']] },
    { who: 'viejo', lines: [['Zapata vive en la memoria del pueblo.', 'Zapata lives on in the memory of the people.', 'n8e'], ["Tierra y Libertad.", "Land and Liberty.", 'n8f']] },
  ],
  notes: [
    ['Artículo 27', 'Las ideas de Zapata inspiraron el Artículo 27 de la Constitución de 1917.', "Zapata's ideas inspired Article 27 of the 1917 Constitution."],
    ['¿De qué habla?', 'De la propiedad de la tierra.', 'About who owns the land.'],
    ['Hoy', 'Zapata es un símbolo para los movimientos campesinos e indígenas.', 'Zapata is a symbol for farmer and Indigenous movements.'],
  ],
  gate: [
    { q: '¿Qué artículo de la Constitución inspiró Zapata?', en: 'Which article did Zapata inspire?', o: ['Artículo 27', 'Artículo 3', 'Artículo 1', 'Artículo 123'], ex: 'Artículo 27: la tierra.' },
    { write: 4 },
  ],
  battle: { name: 'La batalla final', size: 104, gaps: .8, hazard: .8, walkers: 5, flyers: 4, pads: 5, movers: 5, saws: 4, guns: ['shotgun', 'boomerang', 'bomb', 'sniper'], boss: { name: 'EL GRAN HACENDADO', who: 'hacendado', hp: 60, armor: 40, ring: true, hard: true }, theme: 'sky', crates: 3, stars: 3, chests: 2, review: true },
  qs: [
    { q: '¿Qué artículo de la Constitución de 1917 se inspiró en Zapata?', en: 'Which article of the 1917 Constitution was inspired by Zapata?', o: ['Artículo 27', 'Artículo 3', 'Artículo 123', 'Artículo 1'], ex: 'Artículo 27.' },
    { q: '¿De qué habla el Artículo 27?', en: 'What is Article 27 about?', o: ['De la propiedad de la tierra', 'De las escuelas', 'De los trabajadores', 'De la libertad de expresión'], ex: 'Propiedad de la tierra = land ownership.' },
    { q: '¿Qué es Zapata hoy?', en: 'What is Zapata today?', o: ['Un símbolo de la lucha por la tierra', 'Un hacendado famoso', 'Un presidente', 'Un dictador'], ex: 'Un símbolo (una bandera) para campesinos e indígenas.' },
    { q: 'Las ideas de Zapata ___ el Artículo 27. (inspirar)', en: "Zapata's ideas ___ Article 27. (inspired)", o: ['inspiraron', 'inspiró', 'inspiramos', 'inspira'], ex: 'Las ideas = ellas: inspiraron.', v: [['inspiraron', 'inspirar', 'pretérito', 'inspired']] },
    { q: 'Zapata ___ por la tierra toda su vida. (luchar, presente perfecto)', en: 'Zapata ___ for the land. (has fought)', o: ['ha luchado', 'había luchado', 'lucha', 'luchará'], ex: 'Ha + -ado: ha luchado.', v: [['ha luchado', 'luchar', 'presente perfecto', 'has fought']] },
  ],
  end: [['Las ideas de Zapata inspiraron el Artículo 27 de la Constitución de 1917.', "Zapata's ideas inspired Article 27 of the 1917 Constitution."], ['Hoy es un símbolo para campesinos e indígenas. Tierra y Libertad.', 'Today he is a symbol for farmers and Indigenous people. Land and Liberty.']], endVo: 'c8z',
},
];

// Playable characters — each one has a different ability
const HEROES = [
  { id: 'zapata',   name: 'Emiliano Zapata',    ab: 'Líder',      es: 'Empieza con racha 1.',            en: 'Starts every question with a 1 streak.' },
  { id: 'campesino',name: 'Campesino',          ab: 'Rápido',     es: 'Corre más rápido.',                en: 'Runs faster.' },
  { id: 'villa',    name: 'Pancho Villa',       ab: 'Jinete',     es: 'Triple salto.',                    en: 'Can jump three times.' },
  { id: 'madero',   name: 'Francisco I. Madero',ab: 'Paciente',   es: 'Castigo de 5 segundos, no 10.',     en: 'Wrong-answer lockout is 5 s, not 10.' },
  { id: 'diaz',     name: 'Porfirio Díaz',      ab: 'Blindado',   es: 'Recibe la mitad del daño.',         en: 'Takes half damage.' },
  { id: 'huerta',   name: 'Victoriano Huerta',  ab: 'Ráfaga',     es: 'Dispara el doble de rápido.',       en: 'Shoots twice as fast.' },
  { id: 'carranza', name: 'Venustiano Carranza',ab: 'Cañón',      es: 'Sus disparos hacen doble daño.',    en: 'Shots do double damage.' },
  { id: 'guajardo', name: 'Jesús Guajardo',     ab: 'Engaño',     es: 'No pierde la racha al fallar.',     en: "Keeps the streak after a wrong answer." },
];

// Lines spoken outside the chapters
const EXTRA_VO = [
  ['guardia', 'Para pasar, contesta mis preguntas.', 'Answer my questions to pass.', 'g1'],
  ['guardia', 'Primero habla con todos.', 'Talk to everyone first.', 'g2'],
  ['narr', 'Fin. Tierra y Libertad.', 'The end. Land and Liberty.', 'fin'],
];

// Chapter end cards are spoken too (endVo). Collect every voice line for the generator.
function joinCard(parts) {
  return parts.reduce((acc, p) => !acc ? p : acc + (/^[a-záéíóúñ]/.test(p) ? ' ' : /[.!?]$/.test(acc) ? ' ' : '. ') + p, '');
}
function allVoiceLines() {
  const out = [];
  for (const ch of CHAPTERS) {
    for (const s of ch.cut) {
      if (s.card) out.push({ id: s.vo, who: 'narr', es: joinCard(s.card.map(c => c[0])) });
      else if (s.say) out.push({ id: s.vo, who: s.say, es: s.es });
      else if (s.narr) out.push({ id: s.vo, who: 'narr', es: s.narr });
    }
    for (const n of ch.npcs) for (const l of n.lines) out.push({ id: l[2], who: n.who, es: l[0] });
    out.push({ id: ch.endVo, who: 'narr', es: ch.end.map(e => e[0]).join(' ') });
  }
  for (const [who, es, , id] of EXTRA_VO) out.push({ id, who, es });
  return out;
}
if (typeof module !== 'undefined') module.exports = { CHAPTERS, CAST, HEROES, EXTRA_VO, allVoiceLines };

// ---------------------------------------------------------------- written answers (forgiving)
// Each answer needs a few short ideas. Spelling mistakes are OK.
const WRITE = [
  { q: '¿Cuál era el lema del Plan de Ayala? ¿Qué significaba?', en: 'What was the motto of the Plan de Ayala? What did it mean?',
    ideas: [['Tierra', ['tierra', 'tierras']], ['Libertad', ['libertad', 'libres', 'libre']], ['recuperar la tierra / ser libres', ['recuperar', 'devolver', 'tener', 'propia', 'campesinos', 'trabajar']]],
    model: 'El lema era "Tierra y Libertad". Significaba recuperar la tierra y ser libres.' },
  { q: '¿Por qué Zapata rompió con Madero?', en: 'Why did Zapata break with Madero?',
    ideas: [['Madero', ['madero']], ['no devolvió', ['devolvio', 'devolver', 'regreso', 'dio', 'no']], ['las tierras', ['tierra', 'tierras']]],
    model: 'Porque Madero no devolvió las tierras a los campesinos.' },
  { q: '¿Qué cargo tuvo Zapata en 1909? ¿Cuál era su trabajo?', en: 'What job did Zapata have in 1909? What did he do?',
    ideas: [['presidente', ['presidente']], ['del Consejo (Municipal)', ['consejo', 'municipal']], ['defender las tierras', ['defender', 'defensa', 'proteger', 'tierra', 'tierras', 'recuperar']]],
    model: 'Fue presidente del Consejo Municipal de Anenecuilco. Su trabajo era defender las tierras.' },
  { q: '¿Cómo engañaron a Zapata?', en: 'How did they trick Zapata?',
    ideas: [['armas', ['armas', 'arma']], ['municiones', ['municiones', 'municion', 'balas']], ['una promesa', ['promesa', 'prometio', 'prometieron', 'dar', 'darle', 'dieron', 'dio', 'regalo', 'trampa', 'enga']]],
    model: 'Le prometieron armas y municiones. Fue una trampa.' },
  { q: '¿Qué inspiró Zapata en la Constitución de 1917? ¿Qué es hoy?', en: 'What did Zapata inspire in the 1917 Constitution? What is he today?',
    ideas: [['Artículo 27', ['27', 'veintisiete', 'articulo']], ['la tierra', ['tierra', 'tierras', 'propiedad']], ['un símbolo hoy', ['simbolo', 'bandera', 'heroe', 'campesinos', 'indigenas', 'movimientos']]],
    model: 'Inspiró el Artículo 27, sobre la tierra. Hoy es un símbolo para los campesinos.' },
];
// Why a wrong choice is wrong
const WHY_WRONG = {
  'Ciudad de México': 'Ahí entró en 1914, pero no nació ni murió ahí.', 'En la Ciudad de México': 'Ahí entró en 1914.',
  'Chihuahua': 'Chihuahua está en el norte, la tierra de Villa.', 'Aguascalientes': 'Ahí fue la Convención de 1914.',
  '10 de abril de 1919': 'Ese día murió Zapata.', '25 de noviembre de 1911': 'Ese día hizo el Plan de Ayala.', 'Diciembre de 1914': 'Ese mes entró a la capital.',
  '1909': 'En 1909 fue presidente del Consejo.', '1911': 'En 1911 hizo el Plan de Ayala.', '1919': 'En 1919 murió.',
  'Pancho Villa': 'Villa era su aliado del norte.', 'Madero': 'Madero empezó la Revolución en 1910.', 'Zapata': 'Zapata luchaba contra los hacendados.',
  'Porfirio Díaz': 'Díaz era el dictador antes de la Revolución.', 'Carranza': 'Carranza fue aliado y después enemigo.', 'Huerta': 'Huerta fue el dictador de 1913.',
  'El Plan de San Luis': 'Ese plan era de Madero (1910).', 'La Constitución de 1917': 'Es de 1917, no de 1911.', 'El Plan de Guadalupe': 'Ese plan era de Carranza.',
  'División del Norte': 'Era el ejército de Villa, en el norte.', 'Ejército Constitucionalista': 'Era el ejército de Carranza.', 'Guardia Nacional del Sur': 'Ese nombre no existía.',
  'En el Consejo Municipal de Anenecuilco': 'Ahí trabajó en 1909.', 'En la Convención de Aguascalientes': 'Fue una reunión en 1914.', 'En el Palacio Nacional de la Ciudad de México': 'No, murió en una hacienda en Morelos.',
  'Jesús Guajardo': 'Guajardo hizo la trampa. González la planeó.', 'Pablo González': 'González planeó la trampa. Guajardo la hizo.',
  'Orden y Progreso': 'Ese era el lema de Porfirio Díaz.', 'Pan y Paz': 'No era el lema.', 'Viva México': 'No era el lema.',
  'Ser presidente de México': 'Zapata no quería el poder. Quería tierra.', 'Ayudar a los hacendados': 'Al revés: luchaba contra ellos.',
  'Artículo 3': 'El Artículo 3 habla de la educación.', 'Artículo 123': 'El Artículo 123 habla de los trabajadores.', 'Artículo 1': 'El Artículo 1 habla de los derechos.',
  'La mitad': 'Era una tercera parte (1/3).', 'Toda': 'Era una tercera parte (1/3).', 'Nada': 'Era una tercera parte (1/3).',
};

// icons for each chapter's 3 historical objects (sky, underground, secret room)
const ICONS = [['hat', 'doc', 'flag'], ['book', 'doc', 'hat'], ['flag', 'doc', 'rifle'], ['medal', 'rifle', 'doc'], ['book', 'flag', 'hat'], ['book', 'doc', 'hat'], ['doc', 'rifle', 'hat'], ['book', 'flag', 'doc']];
CHAPTERS.forEach((c, i) => c.icons = ICONS[i]);
