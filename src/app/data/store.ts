// Curated store layer: what G2Store sells and for how much. IGDB facts (covers, platforms, dates,
// ratings) live in games.json and are refreshed with `npm run games`; this file never needs credentials.
// No runtime imports here: scripts/*.ts load it directly with Node type stripping.

export const SITE_URL = 'https://g2martins.github.io/G2Store';
export const SITE_NAME = 'G2Store';
export const AUTHOR = 'Gustavo Martins Gripaldi';
// Trailing slashes: the portfolio is on GitHub Pages, where /path answers with a 301 to /path/.
export const PORTFOLIO_URL = 'https://g2portfolio.grovicdata.com/';
export const PROJECT_URL = 'https://g2portfolio.grovicdata.com/projetos/g2store/';
export const REPO_URL = 'https://github.com/G2Martins/G2Store';
export const OG_IMAGE = '/og/g2store.png';
export const COUPON = { code: 'G2DEMO10', percent: 10 };
export const SHIPPING = 39.9;

export type Family = 'pc' | 'playstation' | 'xbox' | 'nintendo';
export type Platform = 'pc' | 'ps5' | 'ps4' | 'xsx' | 'xone' | 'switch2' | 'switch';

/** One store per platform family: a game is only sold where IGDB says it ships. */
export const FAMILIES: Record<Family, { label: string; store: string; code: string; platforms: Platform[] }> = {
  pc: { label: 'PC', store: 'Steam', code: 'Chave Steam', platforms: ['pc'] },
  playstation: { label: 'PlayStation', store: 'PlayStation Store', code: 'Código PlayStation Store', platforms: ['ps5', 'ps4'] },
  xbox: { label: 'Xbox', store: 'Microsoft Store (Xbox)', code: 'Código Microsoft Store', platforms: ['xsx', 'xone'] },
  nintendo: { label: 'Nintendo', store: 'Nintendo eShop', code: 'Código Nintendo eShop', platforms: ['switch2', 'switch'] },
};
export const FAMILY_ORDER: Family[] = ['pc', 'playstation', 'xbox', 'nintendo'];

export const PLATFORM_LABEL: Record<Platform, string> = {
  pc: 'PC', ps5: 'PS5', ps4: 'PS4', xsx: 'Xbox Series X|S', xone: 'Xbox One', switch2: 'Switch 2', switch: 'Switch',
};

/** Step-by-step activation, shown on the product page and next to every delivered code. */
export const ACTIVATION: Record<Family, string[]> = {
  pc: [
    'Abra o aplicativo da Steam e entre na sua conta.',
    'No menu Jogos, escolha "Ativar um produto na Steam".',
    'Cole o código, aceite o contrato e o jogo vai para a sua biblioteca.',
  ],
  playstation: [
    'No console, abra a PlayStation Store e toque no menu "...".',
    'Escolha "Resgatar códigos" e digite os caracteres do código.',
    'Confirme: o conteúdo fica disponível na sua biblioteca para baixar.',
  ],
  xbox: [
    'Acesse microsoft.com/redeem ou abra a Microsoft Store no console.',
    'Entre com a conta Microsoft usada no Xbox.',
    'Digite o código de 25 caracteres e confirme o resgate.',
  ],
  nintendo: [
    'No Switch ou Switch 2, abra o Nintendo eShop.',
    'Selecione o perfil e toque em "Resgatar código".',
    'Digite o código de 16 caracteres e o download começa em seguida.',
  ],
};

export interface StoreGame {
  igdb: number;
  slug: string;
  /** Display name override (IGDB naming is sometimes off for PT-BR shoppers). */
  name?: string;
  /** Standard edition price on consoles, BRL. PC keys cost ~15% less. */
  price: number;
  /** Extra editions and their console price. */
  ed?: Record<string, number>;
  off?: number;
  tags?: string[];
  /** Best-seller rank (1 = top). */
  top?: number;
  /** ClassInd override when IGDB has no rating yet. */
  classInd?: string;
  desc: string;
}

export const GAMES: StoreGame[] = [
  {
    igdb: 52189, slug: 'grand-theft-auto-vi', price: 399.9, ed: { Ultimate: 499.9 }, top: 1, classInd: '18',
    desc: 'O estado de Leonida, com as ruas de neon de Vice City e muito além, recebe a maior e mais imersiva evolução da série Grand Theft Auto. Lucia e Jason entram num esquema que dá errado logo no começo e precisam sobreviver num mapa vivo, cheio de atividades e histórias paralelas.',
  },
  {
    igdb: 405460, slug: 'the-legend-of-zelda-ocarina-of-time', price: 399, top: 4,
    desc: 'Ganondorf quer roubar a Triforce do Reino Sagrado e dominar Hyrule. Link precisa se tornar o Herói do Tempo nesta releitura do clássico de 1998, reconstruída do zero para o Nintendo Switch 2, com visual novo e controles modernos.',
  },
  {
    igdb: 168667, slug: 'marvels-wolverine', price: 349.9, ed: { 'Digital Deluxe': 419.9 }, top: 11,
    desc: 'Aventura de ação para um jogador em que você controla Logan e suas garras de adamantium em combates brutais e de curta distância. Do mesmo universo de Marvel\'s Spider-Man, com uma história fechada e vilões saídos dos quadrinhos dos X-Men.',
  },
  {
    igdb: 305160, slug: 'gears-of-war-e-day', price: 349.9, ed: { Premium: 449.9 }, tags: ['Play Anywhere'],
    desc: 'O Dia da Emergência pelos olhos de Marcus Fenix, catorze anos antes do primeiro Gears of War. Ao lado de Dom Santiago, ele volta para casa e encontra a Horda Locust brotando do subsolo. Feito em Unreal Engine 5, com campanha cooperativa e multiplayer.',
  },
  {
    igdb: 92550, slug: 'fable', price: 349.9, ed: { Premium: 449.9 }, tags: ['Play Anywhere'],
    desc: 'RPG de ação em mundo aberto ambientado em Albion, onde cada escolha muda sua jornada e reputação é tudo. Seja o herói que quiser, com o humor britânico da série e finais de conto de fadas que nunca estão garantidos.',
  },
  {
    igdb: 141114, slug: '007-first-light', price: 299.9, ed: { Deluxe: 379.9 }, off: 20,
    desc: 'A origem de James Bond, ainda jovem e impulsivo, no programa de treinamento do MI6. Aventura de espionagem da IO Interactive, estúdio de Hitman, que mistura infiltração, tiroteios e a liberdade de resolver cada missão do seu jeito.',
  },
  {
    igdb: 347668, slug: 'resident-evil-requiem', price: 299.9, ed: { Deluxe: 359.9 }, off: 25, top: 8,
    desc: 'O nono capítulo principal de Resident Evil alterna entre o terror de sobrevivência da analista do FBI Grace Ashcroft e a ação do lendário Leon S. Kennedy. Duas campanhas que se cruzam numa história tensa e emocionante.',
  },
  {
    igdb: 348330, slug: 'forza-horizon-6', price: 349.9, ed: { Deluxe: 419.9, Premium: 499.9 }, off: 15, tags: ['Play Anywhere'],
    desc: 'O Horizon Festival chega ao Japão com mais de 550 carros reais. Comece como turista, monte sua garagem, construa uma casa no Valley Estate e explore estradas de montanha e cidades com amigos no mundo aberto mais bonito da série.',
  },
  {
    igdb: 375232, slug: 'halo-campaign-evolved', price: 249.9, off: 10, tags: ['Play Anywhere'],
    desc: 'Remake fiel e moderno da campanha de Halo: Combat Evolved, com gráficos em alta definição, cinemáticas refeitas, controles atualizados e três missões inéditas de prelúdio com Master Chief e o Sargento Johnson.',
  },
  {
    igdb: 325602, slug: 'onimusha-way-of-the-sword', price: 299.9,
    desc: 'Ação com espadas em uma Kyoto do período Edo tomada pela Malícia. Um samurai que carrega a Manopla Oni enfrenta os Genma, monstros do submundo, em duelos sangrentos que exigem precisão e leitura do inimigo.',
  },
  {
    igdb: 317627, slug: 'ghost-of-yotei', name: 'Ghost of Yōtei', price: 349.9, ed: { 'Digital Deluxe': 399.9 }, off: 20, top: 9,
    desc: 'Trezentos anos depois de Ghost of Tsushima, a mercenária Atsu percorre as terras ao redor do Monte Yōtei, em Ezo, atual Hokkaido. Campos abertos, tundras nevadas e um mundo fora do domínio do Japão, cheio de perigos.',
  },
  {
    igdb: 331215, slug: 'saros', price: 299.9, off: 30,
    desc: 'Da Housemarque, estúdio de Returnal: Arjun Devraj investiga uma colônia perdida no planeta Carcosa. Tiroteio em terceira pessoa rápido, chefes enormes e uma progressão que fica mais forte a cada nova tentativa.',
  },
  {
    igdb: 366893, slug: 'pokemon-pokopia', price: 349,
    desc: 'Os humanos sumiram e o mundo murchou. Como um Ditto que aprendeu a construir, você usa transformações para restaurar a terra, plantar, decorar e criar um paraíso ao lado dos seus Pokémon, sozinho ou com amigos.',
  },
  {
    igdb: 338067, slug: 'mario-kart-world', price: 499, top: 5,
    desc: 'Mario Kart vira mundo aberto: dirija livremente entre as pistas, corra com até 24 pilotos e encare o Knockout Tour, em que os últimos são eliminados a cada checkpoint. Tem trilhos, paredes, barcos e um modo livre para explorar.',
  },
  {
    igdb: 338106, slug: 'donkey-kong-bananza', price: 399, off: 10,
    desc: 'Plataforma 3D em que quase tudo pode ser destruído. Donkey Kong soca, arremessa e escava um enorme mundo subterrâneo em busca de bananas douradas, numa aventura exclusiva do Nintendo Switch 2.',
  },
  {
    igdb: 37136, slug: 'metroid-prime-4-beyond', price: 349,
    desc: 'Depois de um confronto com a atiradora Sylux, Samus Aran é transportada para Viewros, planeta de uma civilização antiga. Escaneie o ambiente, use novos poderes psíquicos e pilote a moto Vi-O-La para encontrar o caminho de casa.',
  },
  {
    igdb: 288327, slug: 'pokemon-legends-z-a', price: 349, off: 15, top: 6,
    desc: 'Lumiose City passa por um plano de reurbanização para ser um lugar de pessoas e Pokémon. Batalhas em tempo real, Mega Evoluções e uma cidade inteira para explorar nesta nova aventura da linha Legends.',
  },
  {
    igdb: 115289, slug: 'hollow-knight-silksong', price: 59.9, top: 12,
    desc: 'A sequência de Hollow Knight coloca você no papel de Hornet, caçadora letal, em um reino novo. Plataforma e combate ágeis, centenas de inimigos, chefes memoráveis e segredos ligados ao passado da protagonista.',
  },
  {
    igdb: 305152, slug: 'clair-obscur-expedition-33', price: 199.9, ed: { Deluxe: 239.9 }, off: 30,
    desc: 'Lidere a Expedição 33 na missão de destruir a Pintora antes que ela pinte a morte outra vez. RPG por turnos com ações em tempo real, num mundo inspirado na Belle Époque francesa e com uma das trilhas sonoras mais elogiadas dos últimos anos.',
  },
  {
    igdb: 317407, slug: 'battlefield-6', price: 349.9, ed: { Phantom: 449.9 }, off: 40, top: 7,
    desc: 'Tiro em primeira pessoa com campanha e multiplayer em larga escala: infantaria, veículos, classes de esquadrão e destruição de cenário. Inclui o Battlefield Portal para criar e compartilhar modos próprios.',
  },
  {
    igdb: 353848, slug: 'ea-sports-fc-26', price: 349.9, ed: { Ultimate: 499.9 }, off: 50, top: 2, tags: ['Cross Buy'],
    desc: 'Futebol com Arquétipos inspirados em craques reais, Modo Carreira com desafios de técnico ao vivo e o Ultimate Team de sempre. A temporada 26 da série que substituiu FIFA.',
  },
  {
    igdb: 348220, slug: 'call-of-duty-black-ops-7', price: 399.9, ed: { Vault: 499.9 }, off: 35, top: 3, tags: ['Cross Buy'],
    desc: 'Black Ops em 2035, de Treyarch e Raven: campanha cooperativa para até quatro jogadores, multiplayer 6v6 e 20v20 e o modo Zumbis por rodadas, com progressão de armas e scorestreaks.',
  },
  {
    igdb: 119133, slug: 'elden-ring', price: 249.9, ed: { 'Shadow of the Erdtree': 399.9 }, off: 50, top: 10,
    desc: 'RPG de ação da FromSoftware com mundo criado em parceria com George R. R. Martin. Como um Maculado, explore as Terras Intermédias, enfrente chefes desafiadores e restaure o Anel Prístino para se tornar o Lorde Prístino.',
  },
  {
    igdb: 279661, slug: 'monster-hunter-wilds', price: 299.9, ed: { Deluxe: 379.9 }, off: 45,
    desc: 'Caçadas cooperativas em biomas que mudam de forma drástica com o clima. Estude os monstros, monte o equipamento certo e enfrente criaturas gigantes sozinho ou com até três amigos.',
  },
  {
    igdb: 134612, slug: 'pragmata', price: 299.9, off: 15,
    desc: 'Ficção científica da Capcom numa estação lunar: Hugh e a androide Diana trabalham juntos, ele atirando e ela hackeando os sistemas dos inimigos em tempo real.',
  },
  {
    igdb: 228530, slug: 'death-stranding-2-on-the-beach', name: 'Death Stranding 2: On the Beach', price: 349.9, ed: { 'Digital Deluxe': 399.9 }, off: 35,
    desc: 'Sam Porter Bridges volta à estrada para conectar sobreviventes isolados pelo México e pela Austrália. Entregas em que peso e terreno importam, estradas e monotrilhos construídos com outros jogadores e mais combate que no primeiro jogo.',
  },
  {
    igdb: 127044, slug: 'marvels-spider-man-2', price: 299.9, off: 40,
    desc: 'Peter Parker e Miles Morales dividem Nova York e enfrentam Kraven e Venom. Troque de herói a qualquer momento, cada um com habilidades próprias, numa cidade maior e com as novas asas de teia.',
  },
  {
    igdb: 112875, slug: 'god-of-war-ragnarok', price: 249.9, ed: { 'Digital Deluxe': 319.9 }, off: 50, tags: ['Cross Buy'],
    desc: 'Kratos e Atreus percorrem os Nove Reinos em busca de respostas enquanto o Ragnarök se aproxima. Continuação de God of War (2018), com combate mais variado e uma das histórias mais elogiadas da geração.',
  },
  {
    igdb: 303811, slug: 'astro-bot', price: 249.9, off: 30,
    desc: 'Plataforma 3D eleito Jogo do Ano: o pequeno Astro reúne a tripulação espalhada pela galáxia, com fases cheias de ideias e participações de ícones do PlayStation. Usa todos os recursos do DualSense.',
  },
  {
    igdb: 119388, slug: 'the-legend-of-zelda-tears-of-the-kingdom', price: 349,
    desc: 'A sequência de Breath of the Wild amplia Hyrule para o céu e para o subsolo. Com os novos poderes de Link, construa veículos, combine armas e escolha o próprio caminho contra as forças que ameaçam o reino.',
  },
  {
    igdb: 109462, slug: 'animal-crossing-new-horizons', price: 299,
    desc: 'Mude para uma ilha deserta e transforme o lugar no seu paraíso. Pesque, colecione insetos, decore, receba vizinhos e acompanhe estações e horários iguais aos da vida real.',
  },
  {
    igdb: 338105, slug: 'kirby-air-riders', price: 349,
    desc: 'A volta de Kirby Air Ride: escolha piloto e máquina e dispute corridas no chão e no ar ou batalhas frenéticas em arena. A máquina acelera sozinha, você controla o Boost Charge nas curvas.',
  },
  {
    igdb: 96437, slug: 'starfield', price: 249.9, ed: { Premium: 399.9 }, off: 50, tags: ['Play Anywhere'],
    desc: 'RPG espacial da Bethesda: crie seu personagem, explore mais de mil planetas, monte naves, construa postos avançados e entre para facções numa região de 50 anos-luz da Via Láctea.',
  },
  {
    igdb: 142415, slug: 'indiana-jones-and-the-great-circle', price: 299.9, ed: { Premium: 449.9 }, off: 45, tags: ['Play Anywhere'],
    desc: 'Aventura em primeira pessoa entre Os Caçadores da Arca Perdida e A Última Cruzada. Da MachineGames, mistura exploração, quebra-cabeças, furtividade e muito chicote numa viagem ao redor do mundo.',
  },
  {
    igdb: 1877, slug: 'cyberpunk-2077', price: 199.9, ed: { Ultimate: 299.9 }, off: 60,
    desc: 'Em Night City, você é V, mercenário em busca de um implante que guarda o segredo da imortalidade. Mundo aberto, implantes cibernéticos e escolhas que mudam a história. A edição Ultimate inclui a expansão Phantom Liberty.',
  },
  {
    igdb: 25076, slug: 'red-dead-redemption-2', price: 249.9, ed: { Ultimate: 299.9 }, off: 70,
    desc: 'A história épica de Arthur Morgan e da gangue Van der Linde em fuga pelos Estados Unidos no fim da era dos foras da lei. Um dos mundos abertos mais detalhados já feitos, com o Red Dead Online incluído.',
  },
  {
    igdb: 119171, slug: 'baldurs-gate-3', name: "Baldur's Gate 3", price: 199.9, ed: { 'Digital Deluxe': 249.9 }, off: 20,
    desc: 'Um mal antigo voltou a Baldur\'s Gate. RPG baseado em Dungeons & Dragons, com combate por turnos, escolhas que mudam tudo e cooperativo online ou em tela dividida.',
  },
  {
    igdb: 17000, slug: 'stardew-valley', price: 49.9,
    desc: 'Você herdou a fazenda do avô em Stardew Valley. Plante, crie animais, pesque, explore cavernas, faça amizades na cidade e jogue em cooperativo com até sete amigos.',
  },
  {
    igdb: 228525, slug: 'hades-ii', price: 99.9,
    desc: 'A sequência do premiado roguelike: como Melinoë, princesa do Submundo, use feitiçaria sombria para enfrentar Cronos, o Titã do Tempo. Cada tentativa traz novos poderes dos deuses do Olimpo.',
  },
  {
    igdb: 325594, slug: 'split-fiction', price: 249.9, off: 40, tags: ['Passe de Amigo'],
    desc: 'Cooperativo da Hazelight, de It Takes Two: as escritoras Mio e Zoe ficam presas nas próprias histórias e alternam entre ficção científica e fantasia. O Passe de Amigo deixa uma segunda pessoa jogar sem comprar.',
  },
  {
    igdb: 298526, slug: 'kingdom-come-deliverance-ii', price: 249.9, ed: { Gold: 349.9 }, off: 35,
    desc: 'RPG de ação com foco em história num mundo aberto realista da Boêmia do século 15. Acompanhe o jovem Henry numa jornada épica, com combate de espada exigente e escolhas que pesam.',
  },
  {
    igdb: 136879, slug: 'black-myth-wukong', price: 229.9, ed: { 'Digital Deluxe': 299.9 }, off: 30,
    desc: 'RPG de ação inspirado no clássico chinês Jornada ao Oeste. Como o Predestinado, um macaco guerreiro com cajado, enfrente chefes intensos com um sistema de transformações e magias.',
  },
];

export interface GiftCard {
  slug: string;
  family: Family;
  name: string;
  values: number[];
  note: string;
}

export const GIFT_CARDS: GiftCard[] = [
  { slug: 'steam', family: 'pc', name: 'Cartão Steam', values: [30, 50, 100, 150, 250], note: 'Crédito na Carteira Steam em reais, sem validade.' },
  { slug: 'playstation', family: 'playstation', name: 'Cartão PlayStation Store', values: [50, 100, 150, 250, 500], note: 'Saldo para jogos, DLCs e assinaturas na PlayStation Store Brasil.' },
  { slug: 'xbox', family: 'xbox', name: 'Cartão Xbox', values: [50, 100, 150, 250], note: 'Saldo para a Microsoft Store no Xbox e no Windows.' },
  { slug: 'nintendo', family: 'nintendo', name: 'Cartão Nintendo eShop', values: [50, 100, 150, 250, 500], note: 'Crédito para o Nintendo eShop no Switch e no Switch 2.' },
];

export type HardwareArt = 'tower' | 'tower-pro' | 'monolith' | 'compact' | 'hybrid' | 'deck' | 'pad';

export interface Hardware {
  slug: string;
  family: Family;
  kind: 'Console' | 'Portátil' | 'Controle';
  name: string;
  price: number;
  off?: number;
  art: HardwareArt;
  specs: string[];
  note?: string;
}

export const HARDWARE: Hardware[] = [
  { slug: 'playstation-5-slim', family: 'playstation', kind: 'Console', name: 'PlayStation 5 Slim', price: 3799.9, off: 10, art: 'tower', specs: ['SSD de 1 TB', 'Leitor de disco', 'Até 4K e 120 fps'] },
  { slug: 'playstation-5-pro', family: 'playstation', kind: 'Console', name: 'PlayStation 5 Pro', price: 6299.9, art: 'tower-pro', specs: ['SSD de 2 TB', 'Ray tracing avançado', 'Upscaling PSSR'] },
  { slug: 'xbox-series-x', family: 'xbox', kind: 'Console', name: 'Xbox Series X', price: 4599.9, off: 8, art: 'monolith', specs: ['SSD de 1 TB', 'Leitor de disco', 'Até 4K e 120 fps'] },
  { slug: 'xbox-series-s', family: 'xbox', kind: 'Console', name: 'Xbox Series S', price: 2899.9, art: 'compact', specs: ['SSD de 512 GB', '100% digital', 'Até 1440p e 120 fps'] },
  { slug: 'nintendo-switch-2', family: 'nintendo', kind: 'Console', name: 'Nintendo Switch 2', price: 4199.9, art: 'hybrid', specs: ['Tela LCD de 7,9"', 'Modo TV até 4K', 'Joy-Con 2 magnéticos'] },
  { slug: 'nintendo-switch-2-edicao-zelda', family: 'nintendo', kind: 'Console', name: 'Nintendo Switch 2 · Edição Zelda 40 anos', price: 4699.9, art: 'hybrid', specs: ['Console e Joy-Con 2 com arte especial', 'Mesmo hardware do Switch 2', 'Lançado em 29/10/2026'], note: 'Edição comemorativa: o jogo The Legend of Zelda: Ocarina of Time é vendido separadamente.' },
  { slug: 'steam-deck-oled', family: 'pc', kind: 'Portátil', name: 'Steam Deck OLED 512 GB', price: 4999.9, art: 'deck', specs: ['Tela OLED HDR de 7,4"', 'Roda sua biblioteca Steam', 'Bateria de 50 Wh'] },
  { slug: 'controle-dualsense', family: 'playstation', kind: 'Controle', name: 'Controle sem fio DualSense', price: 499.9, off: 15, art: 'pad', specs: ['Gatilhos adaptáveis', 'Resposta tátil', 'USB-C'] },
  { slug: 'controle-xbox', family: 'xbox', kind: 'Controle', name: 'Controle sem fio Xbox', price: 449.9, art: 'pad', specs: ['Bluetooth e Xbox Wireless', 'Botão Compartilhar', 'Funciona no PC'] },
];
