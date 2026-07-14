import type { ConfigFieldMeta, ConfigValues } from './types'

/**
 * Schema for PalWorldSettings.ini OptionSettings keys.
 * Descriptions are in French for the primary UI language.
 */
export const CONFIG_SCHEMA: ConfigFieldMeta[] = [
  // Identity
  {
    key: 'ServerName',
    label: 'Nom du serveur',
    description: 'Nom affiché dans le navigateur communautaire.',
    type: 'string',
    category: 'Identité'
  },
  {
    key: 'ServerDescription',
    label: 'Description',
    description: 'Courte description du serveur.',
    type: 'string',
    category: 'Identité'
  },
  {
    key: 'AdminPassword',
    label: 'Mot de passe admin',
    description: 'Mot de passe administrateur (RCON / REST / commandes admin).',
    type: 'string',
    category: 'Identité'
  },
  {
    key: 'ServerPassword',
    label: 'Mot de passe serveur',
    description: 'Laissez vide pour un serveur ouvert.',
    type: 'string',
    category: 'Identité'
  },
  {
    key: 'PublicPort',
    label: 'Port public',
    description: 'Port de jeu annoncé (défaut 8211).',
    type: 'number',
    category: 'Identité',
    min: 1,
    max: 65535,
    step: 1
  },
  {
    key: 'PublicIP',
    label: 'IP publique',
    description: 'Généralement laisser vide (détection auto).',
    type: 'string',
    category: 'Identité'
  },
  {
    key: 'Region',
    label: 'Région',
    description: 'Code région affiché (optionnel).',
    type: 'string',
    category: 'Identité'
  },
  {
    key: 'ServerPlayerMaxNum',
    label: 'Joueurs max',
    description: 'Nombre maximum de joueurs (1–32).',
    type: 'number',
    category: 'Identité',
    min: 1,
    max: 32,
    step: 1
  },
  {
    key: 'CoopPlayerMaxNum',
    label: 'Joueurs coop max',
    description: 'Limite coop session.',
    type: 'number',
    category: 'Identité',
    min: 1,
    max: 32,
    step: 1
  },

  // Crossplay / auth
  {
    key: 'CrossplayPlatforms',
    label: 'Plateformes crossplay',
    description: 'Ex: (Steam,Xbox). Requis pour Game Pass / Xbox.',
    type: 'string',
    category: 'Réseau & Crossplay'
  },
  {
    key: 'bUseAuth',
    label: 'Authentification',
    description: 'Doit être activé pour le crossplay.',
    type: 'boolean',
    category: 'Réseau & Crossplay'
  },
  {
    key: 'RCONEnabled',
    label: 'RCON activé',
    description: 'Active l’API RCON pour le dashboard.',
    type: 'boolean',
    category: 'Réseau & Crossplay'
  },
  {
    key: 'RCONPort',
    label: 'Port RCON',
    description: 'Port TCP RCON (ne pas exposer sur Internet).',
    type: 'number',
    category: 'Réseau & Crossplay',
    min: 1,
    max: 65535,
    step: 1
  },
  {
    key: 'RESTAPIEnabled',
    label: 'REST API activée',
    description: 'Active l’API REST officielle.',
    type: 'boolean',
    category: 'Réseau & Crossplay'
  },
  {
    key: 'RESTAPIPort',
    label: 'Port REST API',
    description: 'Port TCP de l’API REST.',
    type: 'number',
    category: 'Réseau & Crossplay',
    min: 1,
    max: 65535,
    step: 1
  },
  {
    key: 'RESTAPIKey',
    label: 'Clé REST API',
    description: 'Clé d’accès à l’API REST.',
    type: 'string',
    category: 'Réseau & Crossplay'
  },
  {
    key: 'BanListURL',
    label: 'URL banlist',
    description: 'URL de la liste de ban globale Pocketpair.',
    type: 'string',
    category: 'Réseau & Crossplay'
  },
  {
    key: 'bAllowClientMod',
    label: 'Autoriser mods client',
    description: 'Permet aux clients d’utiliser des mods.',
    type: 'boolean',
    category: 'Réseau & Crossplay'
  },
  {
    key: 'bEnableVoiceChat',
    label: 'Chat vocal',
    description: 'Active le chat vocal intégré.',
    type: 'boolean',
    category: 'Réseau & Crossplay'
  },
  {
    key: 'bIsShowJoinLeftMessage',
    label: 'Messages join/leave',
    description: 'Affiche les messages de connexion / déconnexion.',
    type: 'boolean',
    category: 'Réseau & Crossplay'
  },
  {
    key: 'ChatPostLimitPerMinute',
    label: 'Limite chat / min',
    description: 'Nombre max de messages chat par minute.',
    type: 'number',
    category: 'Réseau & Crossplay',
    min: 1,
    max: 200,
    step: 1
  },

  // World rates
  {
    key: 'Difficulty',
    label: 'Difficulté',
    description: 'Preset de difficulté (None = personnalisé).',
    type: 'enum',
    category: 'Monde',
    options: ['None', 'Casual', 'Normal', 'Hard']
  },
  {
    key: 'DayTimeSpeedRate',
    label: 'Vitesse jour',
    description: 'Multiplicateur de durée du jour.',
    type: 'number',
    category: 'Monde',
    min: 0.1,
    max: 5,
    step: 0.1
  },
  {
    key: 'NightTimeSpeedRate',
    label: 'Vitesse nuit',
    description: 'Multiplicateur de durée de la nuit.',
    type: 'number',
    category: 'Monde',
    min: 0.1,
    max: 5,
    step: 0.1
  },
  {
    key: 'ExpRate',
    label: 'Gain d’XP',
    description: 'Multiplicateur d’expérience.',
    type: 'number',
    category: 'Monde',
    min: 0.1,
    max: 20,
    step: 0.1
  },
  {
    key: 'PalCaptureRate',
    label: 'Taux de capture',
    description: 'Multiplicateur de réussite de capture.',
    type: 'number',
    category: 'Monde',
    min: 0.1,
    max: 20,
    step: 0.1
  },
  {
    key: 'PalSpawnNumRate',
    label: 'Densité de spawn',
    description: 'Multiplicateur du nombre de Pals sauvages.',
    type: 'number',
    category: 'Monde',
    min: 0.1,
    max: 5,
    step: 0.1
  },
  {
    key: 'CollectionDropRate',
    label: 'Taux de récolte',
    description: 'Multiplicateur de drops de collecte.',
    type: 'number',
    category: 'Monde',
    min: 0.1,
    max: 20,
    step: 0.1
  },
  {
    key: 'CollectionObjectHpRate',
    label: 'HP objets collectibles',
    description: 'Multiplicateur de vie des objets récoltables.',
    type: 'number',
    category: 'Monde',
    min: 0.1,
    max: 10,
    step: 0.1
  },
  {
    key: 'CollectionObjectRespawnSpeedRate',
    label: 'Respawn collectibles',
    description: 'Vitesse de respawn des objets collectibles (plus bas = plus long).',
    type: 'number',
    category: 'Monde',
    min: 0.1,
    max: 10,
    step: 0.1
  },
  {
    key: 'EnemyDropItemRate',
    label: 'Drop ennemis',
    description: 'Multiplicateur de drops des ennemis.',
    type: 'number',
    category: 'Monde',
    min: 0.1,
    max: 20,
    step: 0.1
  },
  {
    key: 'WorkSpeedRate',
    label: 'Vitesse de travail',
    description: 'Multiplicateur de vitesse de travail des Pals.',
    type: 'number',
    category: 'Monde',
    min: 0.1,
    max: 10,
    step: 0.1
  },
  {
    key: 'SupplyDropSpan',
    label: 'Intervalle ravitaillement',
    description: 'Minutes entre les drops de ravitaillement.',
    type: 'number',
    category: 'Monde',
    min: 1,
    max: 999,
    step: 1,
    unit: 'min'
  },
  {
    key: 'RandomizerType',
    label: 'Type randomizer',
    description: 'Type de randomisation du monde.',
    type: 'enum',
    category: 'Monde',
    options: ['None', 'Region', 'All']
  },
  {
    key: 'RandomizerSeed',
    label: 'Seed randomizer',
    description: 'Graine de randomisation (vide = aléatoire).',
    type: 'string',
    category: 'Monde'
  },
  {
    key: 'bIsRandomizerPalLevelRandom',
    label: 'Niveaux Pals aléatoires',
    description: 'Randomise les niveaux des Pals avec le randomizer.',
    type: 'boolean',
    category: 'Monde'
  },

  // Player / Pal balance
  {
    key: 'PalDamageRateAttack',
    label: 'Dégâts Pals (attaque)',
    description: 'Multiplicateur dégâts infligés par les Pals.',
    type: 'number',
    category: 'Équilibrage',
    min: 0.1,
    max: 10,
    step: 0.1
  },
  {
    key: 'PalDamageRateDefense',
    label: 'Dégâts Pals (défense)',
    description: 'Multiplicateur dégâts reçus par les Pals.',
    type: 'number',
    category: 'Équilibrage',
    min: 0.1,
    max: 10,
    step: 0.1
  },
  {
    key: 'PlayerDamageRateAttack',
    label: 'Dégâts joueur (attaque)',
    description: 'Multiplicateur dégâts infligés par les joueurs.',
    type: 'number',
    category: 'Équilibrage',
    min: 0.1,
    max: 10,
    step: 0.1
  },
  {
    key: 'PlayerDamageRateDefense',
    label: 'Dégâts joueur (défense)',
    description: 'Multiplicateur dégâts reçus par les joueurs.',
    type: 'number',
    category: 'Équilibrage',
    min: 0.1,
    max: 10,
    step: 0.1
  },
  {
    key: 'PlayerStomachDecreaceRate',
    label: 'Faim joueur',
    description: 'Vitesse de diminution de la faim joueur.',
    type: 'number',
    category: 'Équilibrage',
    min: 0,
    max: 10,
    step: 0.1
  },
  {
    key: 'PlayerStaminaDecreaceRate',
    label: 'Stamina joueur',
    description: 'Vitesse de consommation de stamina joueur.',
    type: 'number',
    category: 'Équilibrage',
    min: 0,
    max: 10,
    step: 0.1
  },
  {
    key: 'PlayerAutoHPRegeneRate',
    label: 'Régén HP joueur',
    description: 'Vitesse de régénération HP joueur.',
    type: 'number',
    category: 'Équilibrage',
    min: 0.1,
    max: 10,
    step: 0.1
  },
  {
    key: 'PlayerAutoHpRegeneRateInSleep',
    label: 'Régén HP sommeil',
    description: 'Régénération HP du joueur en sommeil.',
    type: 'number',
    category: 'Équilibrage',
    min: 0.1,
    max: 10,
    step: 0.1
  },
  {
    key: 'PalStomachDecreaceRate',
    label: 'Faim Pals',
    description: 'Vitesse de diminution de la faim des Pals.',
    type: 'number',
    category: 'Équilibrage',
    min: 0,
    max: 10,
    step: 0.1
  },
  {
    key: 'PalStaminaDecreaceRate',
    label: 'Stamina Pals',
    description: 'Consommation de stamina des Pals.',
    type: 'number',
    category: 'Équilibrage',
    min: 0,
    max: 10,
    step: 0.1
  },
  {
    key: 'PalAutoHPRegeneRate',
    label: 'Régén HP Pals',
    description: 'Régénération HP des Pals.',
    type: 'number',
    category: 'Équilibrage',
    min: 0.1,
    max: 10,
    step: 0.1
  },
  {
    key: 'PalAutoHpRegeneRateInSleep',
    label: 'Régén HP Pals (sommeil)',
    description: 'Régénération HP des Pals en sommeil.',
    type: 'number',
    category: 'Équilibrage',
    min: 0.1,
    max: 10,
    step: 0.1
  },
  {
    key: 'EquipmentDurabilityDamageRate',
    label: 'Usure équipement',
    description: 'Multiplicateur d’usure de l’équipement.',
    type: 'number',
    category: 'Équilibrage',
    min: 0,
    max: 10,
    step: 0.1
  },
  {
    key: 'ItemWeightRate',
    label: 'Poids des objets',
    description: 'Multiplicateur de poids des items.',
    type: 'number',
    category: 'Équilibrage',
    min: 0.1,
    max: 10,
    step: 0.1
  },
  {
    key: 'ItemCorruptionMultiplier',
    label: 'Corruption items',
    description: 'Vitesse de pourriture / corruption des items.',
    type: 'number',
    category: 'Équilibrage',
    min: 0,
    max: 10,
    step: 0.1
  },

  // Death / PvP
  {
    key: 'DeathPenalty',
    label: 'Pénalité de mort',
    description: 'Ce que le joueur perd à la mort.',
    type: 'enum',
    category: 'Mort & PvP',
    options: ['None', 'Item', 'ItemAndEquipment', 'All']
  },
  {
    key: 'bEnablePlayerToPlayerDamage',
    label: 'Dégâts joueur→joueur',
    description: 'Permet les dégâts entre joueurs (requis pour PvP).',
    type: 'boolean',
    category: 'Mort & PvP'
  },
  {
    key: 'bEnableFriendlyFire',
    label: 'Tir allié',
    description: 'Active le friendly fire.',
    type: 'boolean',
    category: 'Mort & PvP'
  },
  {
    key: 'bIsPvP',
    label: 'Mode PvP',
    description: 'Active le mode PvP (avec les 2 autres flags PvP).',
    type: 'boolean',
    category: 'Mort & PvP'
  },
  {
    key: 'bEnableDefenseOtherGuildPlayer',
    label: 'Défense autres guildes',
    description: 'Permet d’attaquer les bases d’autres guildes (requis PvP).',
    type: 'boolean',
    category: 'Mort & PvP'
  },
  {
    key: 'bCanPickupOtherGuildDeathPenaltyDrop',
    label: 'Loot mort autres guildes',
    description: 'Permet de ramasser le loot de mort d’autres guildes.',
    type: 'boolean',
    category: 'Mort & PvP'
  },
  {
    key: 'bHardcore',
    label: 'Hardcore',
    description: 'Active le mode hardcore.',
    type: 'boolean',
    category: 'Mort & PvP'
  },
  {
    key: 'bPalLost',
    label: 'Perte de Pals',
    description: 'Les Pals peuvent être perdus à la mort.',
    type: 'boolean',
    category: 'Mort & PvP'
  },
  {
    key: 'bCharacterRecreateInHardcore',
    label: 'Recréation hardcore',
    description: 'Permet de recréer un personnage en hardcore.',
    type: 'boolean',
    category: 'Mort & PvP'
  },
  {
    key: 'bEnableNonLoginPenalty',
    label: 'Pénalité hors-ligne',
    description: 'Applique des pénalités d’inactivité.',
    type: 'boolean',
    category: 'Mort & PvP'
  },

  // Base / guild
  {
    key: 'BaseCampMaxNum',
    label: 'Camps max (serveur)',
    description: 'Nombre max de camps de base sur le serveur.',
    type: 'number',
    category: 'Base & Guilde',
    min: 0,
    max: 500,
    step: 1
  },
  {
    key: 'BaseCampMaxNumInGuild',
    label: 'Camps max / guilde',
    description: 'Nombre max de camps par guilde.',
    type: 'number',
    category: 'Base & Guilde',
    min: 0,
    max: 50,
    step: 1
  },
  {
    key: 'BaseCampWorkerMaxNum',
    label: 'Workers max / camp',
    description: 'Nombre max de Pals travailleurs par camp.',
    type: 'number',
    category: 'Base & Guilde',
    min: 0,
    max: 50,
    step: 1
  },
  {
    key: 'GuildPlayerMaxNum',
    label: 'Joueurs max / guilde',
    description: 'Taille maximale d’une guilde.',
    type: 'number',
    category: 'Base & Guilde',
    min: 1,
    max: 100,
    step: 1
  },
  {
    key: 'bAutoResetGuildNoOnlinePlayers',
    label: 'Reset guilde inactive',
    description: 'Dissout les guildes sans joueurs en ligne après un délai.',
    type: 'boolean',
    category: 'Base & Guilde'
  },
  {
    key: 'AutoResetGuildTimeNoOnlinePlayers',
    label: 'Délai reset guilde',
    description: 'Heures avant reset d’une guilde inactive.',
    type: 'number',
    category: 'Base & Guilde',
    min: 1,
    max: 720,
    step: 1,
    unit: 'h'
  },
  {
    key: 'BuildObjectDamageRate',
    label: 'Dégâts constructions',
    description: 'Multiplicateur de dégâts reçus par les bâtiments.',
    type: 'number',
    category: 'Base & Guilde',
    min: 0,
    max: 10,
    step: 0.1
  },
  {
    key: 'BuildObjectDeteriorationDamageRate',
    label: 'Dégradation bâtiments',
    description: 'Vitesse de dégradation naturelle (0 = aucune).',
    type: 'number',
    category: 'Base & Guilde',
    min: 0,
    max: 10,
    step: 0.1
  },
  {
    key: 'bBuildAreaLimit',
    label: 'Limite zone build',
    description: 'Active les limites de zone de construction.',
    type: 'boolean',
    category: 'Base & Guilde'
  },
  {
    key: 'MaxBuildingLimitNum',
    label: 'Limite bâtiments',
    description: 'Nombre max de bâtiments (0 = illimité).',
    type: 'number',
    category: 'Base & Guilde',
    min: 0,
    max: 100000,
    step: 1
  },
  {
    key: 'bInvisibleOtherGuildBaseCampAreaFX',
    label: 'Masquer FX autres camps',
    description: 'Cache les effets de zone des autres guildes.',
    type: 'boolean',
    category: 'Base & Guilde'
  },

  // Gameplay QoL
  {
    key: 'bEnableInvaderEnemy',
    label: 'Raids / envahisseurs',
    description: 'Active les attaques d’envahisseurs sur les bases.',
    type: 'boolean',
    category: 'Gameplay'
  },
  {
    key: 'bEnableFastTravel',
    label: 'Voyage rapide',
    description: 'Autorise le fast travel.',
    type: 'boolean',
    category: 'Gameplay'
  },
  {
    key: 'bEnableFastTravelOnlyBaseCamp',
    label: 'Fast travel camps uniquement',
    description: 'Limite le fast travel aux camps de base.',
    type: 'boolean',
    category: 'Gameplay'
  },
  {
    key: 'bIsStartLocationSelectByMap',
    label: 'Choix spawn carte',
    description: 'Permet de choisir le point de spawn sur la carte.',
    type: 'boolean',
    category: 'Gameplay'
  },
  {
    key: 'bExistPlayerAfterLogout',
    label: 'Joueur visible hors-ligne',
    description: 'Laisse le personnage dans le monde après déconnexion.',
    type: 'boolean',
    category: 'Gameplay'
  },
  {
    key: 'bShowPlayerList',
    label: 'Liste des joueurs',
    description: 'Affiche la liste des joueurs connectés.',
    type: 'boolean',
    category: 'Gameplay'
  },
  {
    key: 'bIsMultiplay',
    label: 'Multijoueur coop',
    description: 'Active le mode multiplay coop.',
    type: 'boolean',
    category: 'Gameplay'
  },
  {
    key: 'PalEggDefaultHatchingTime',
    label: 'Temps d’éclosion œufs',
    description: 'Heures par défaut pour l’éclosion des œufs.',
    type: 'number',
    category: 'Gameplay',
    min: 0,
    max: 100,
    step: 0.1,
    unit: 'h'
  },
  {
    key: 'DropItemMaxNum',
    label: 'Items droppés max',
    description: 'Nombre max d’items droppés dans le monde.',
    type: 'number',
    category: 'Gameplay',
    min: 0,
    max: 10000,
    step: 1
  },
  {
    key: 'DropItemMaxNum_UNKO',
    label: 'Drops UNKO max',
    description: 'Limite des drops UNKO.',
    type: 'number',
    category: 'Gameplay',
    min: 0,
    max: 1000,
    step: 1
  },
  {
    key: 'DropItemAliveMaxHours',
    label: 'Durée de vie drops',
    description: 'Heures avant disparition des items au sol.',
    type: 'number',
    category: 'Gameplay',
    min: 0,
    max: 72,
    step: 0.1,
    unit: 'h'
  },
  {
    key: 'bActiveUNKO',
    label: 'UNKO actif',
    description: 'Active le contenu UNKO.',
    type: 'boolean',
    category: 'Gameplay'
  },
  {
    key: 'bEnableAimAssistPad',
    label: 'Aim assist manette',
    description: 'Aide à la visée pour manette.',
    type: 'boolean',
    category: 'Gameplay'
  },
  {
    key: 'bEnableAimAssistKeyboard',
    label: 'Aim assist clavier',
    description: 'Aide à la visée pour clavier/souris.',
    type: 'boolean',
    category: 'Gameplay'
  },
  {
    key: 'ServerReplicatePawnCullDistance',
    label: 'Distance cull pawns',
    description: 'Distance de réplication des pawns (perf).',
    type: 'number',
    category: 'Gameplay',
    min: 1000,
    max: 50000,
    step: 100
  },
  {
    key: 'bAllowGlobalPalboxExport',
    label: 'Export palbox global',
    description: 'Autorise l’export vers la palbox globale.',
    type: 'boolean',
    category: 'Gameplay'
  },
  {
    key: 'bAllowGlobalPalboxImport',
    label: 'Import palbox global',
    description: 'Autorise l’import depuis la palbox globale.',
    type: 'boolean',
    category: 'Gameplay'
  },
  {
    key: 'bAllowEnhanceStat_Health',
    label: 'Enhance Health',
    description: 'Autorise l’amélioration de la stat Health.',
    type: 'boolean',
    category: 'Gameplay'
  },
  {
    key: 'bAllowEnhanceStat_Stamina',
    label: 'Enhance Stamina',
    description: 'Autorise l’amélioration de la stat Stamina.',
    type: 'boolean',
    category: 'Gameplay'
  },
  {
    key: 'bAllowEnhanceStat_Attack',
    label: 'Enhance Attack',
    description: 'Autorise l’amélioration de la stat Attack.',
    type: 'boolean',
    category: 'Gameplay'
  },
  {
    key: 'bAllowEnhanceStat_Weight',
    label: 'Enhance Weight',
    description: 'Autorise l’amélioration de la stat Weight.',
    type: 'boolean',
    category: 'Gameplay'
  },
  {
    key: 'bAllowEnhanceStat_WorkSpeed',
    label: 'Enhance WorkSpeed',
    description: 'Autorise l’amélioration de la stat WorkSpeed.',
    type: 'boolean',
    category: 'Gameplay'
  },

  // Persistence
  {
    key: 'bIsUseBackupSaveData',
    label: 'Backup auto saves',
    description: 'Active les backups internes du jeu.',
    type: 'boolean',
    category: 'Sauvegarde'
  },
  {
    key: 'AutoSaveSpan',
    label: 'Intervalle auto-save',
    description: 'Secondes entre chaque sauvegarde automatique.',
    type: 'number',
    category: 'Sauvegarde',
    min: 30,
    max: 3600,
    step: 1,
    unit: 's'
  },
  {
    key: 'LogFormatType',
    label: 'Format des logs',
    description: 'Format des fichiers de log serveur.',
    type: 'enum',
    category: 'Sauvegarde',
    options: ['Text', 'Json']
  }
]

export const DEFAULT_CONFIG_VALUES: ConfigValues = {
  Difficulty: 'None',
  RandomizerType: 'None',
  RandomizerSeed: '',
  bIsRandomizerPalLevelRandom: false,
  DayTimeSpeedRate: 1,
  NightTimeSpeedRate: 1,
  ExpRate: 2,
  PalCaptureRate: 2,
  PalSpawnNumRate: 1,
  PalDamageRateAttack: 1,
  PalDamageRateDefense: 1,
  PlayerDamageRateAttack: 1,
  PlayerDamageRateDefense: 1,
  PlayerStomachDecreaceRate: 0.5,
  PlayerStaminaDecreaceRate: 1,
  PlayerAutoHPRegeneRate: 1,
  PlayerAutoHpRegeneRateInSleep: 1,
  PalStomachDecreaceRate: 0.4,
  PalStaminaDecreaceRate: 1,
  PalAutoHPRegeneRate: 1,
  PalAutoHpRegeneRateInSleep: 1,
  BuildObjectDamageRate: 1,
  BuildObjectDeteriorationDamageRate: 0,
  CollectionDropRate: 2,
  CollectionObjectHpRate: 1,
  CollectionObjectRespawnSpeedRate: 0.5,
  EnemyDropItemRate: 1.5,
  DeathPenalty: 'Item',
  bEnablePlayerToPlayerDamage: false,
  bEnableFriendlyFire: false,
  bEnableInvaderEnemy: true,
  bActiveUNKO: false,
  bEnableAimAssistPad: true,
  bEnableAimAssistKeyboard: false,
  DropItemMaxNum: 3000,
  DropItemMaxNum_UNKO: 100,
  BaseCampMaxNum: 128,
  BaseCampMaxNumInGuild: 4,
  BaseCampWorkerMaxNum: 20,
  DropItemAliveMaxHours: 1,
  bAutoResetGuildNoOnlinePlayers: false,
  AutoResetGuildTimeNoOnlinePlayers: 72,
  GuildPlayerMaxNum: 20,
  PalEggDefaultHatchingTime: 1,
  WorkSpeedRate: 1.5,
  bIsMultiplay: false,
  bIsPvP: false,
  bCanPickupOtherGuildDeathPenaltyDrop: false,
  bEnableNonLoginPenalty: false,
  bEnableFastTravel: true,
  bIsStartLocationSelectByMap: true,
  bExistPlayerAfterLogout: false,
  bEnableDefenseOtherGuildPlayer: false,
  bInvisibleOtherGuildBaseCampAreaFX: false,
  bShowPlayerList: true,
  CoopPlayerMaxNum: 4,
  ServerPlayerMaxNum: 12,
  ServerName: 'My Palworld Server',
  ServerDescription: '',
  AdminPassword: '',
  ServerPassword: '',
  PublicPort: 8211,
  PublicIP: '',
  RCONEnabled: true,
  RCONPort: 25575,
  RESTAPIEnabled: false,
  RESTAPIPort: 8212,
  Region: '',
  bUseAuth: true,
  BanListURL: 'https://b.palworldgame.com/api/banlist.txt',
  RESTAPIKey: '',
  bIsUseBackupSaveData: true,
  LogFormatType: 'Text',
  SupplyDropSpan: 180,
  ChatPostLimitPerMinute: 30,
  AutoSaveSpan: 30,
  bHardcore: false,
  bPalLost: false,
  bBuildAreaLimit: false,
  MaxBuildingLimitNum: 0,
  ServerReplicatePawnCullDistance: 15000,
  bAllowGlobalPalboxExport: true,
  bAllowGlobalPalboxImport: false,
  bEnableFastTravelOnlyBaseCamp: false,
  bAllowClientMod: true,
  EquipmentDurabilityDamageRate: 1,
  ItemWeightRate: 0.4,
  bAllowEnhanceStat_Health: true,
  bAllowEnhanceStat_Stamina: true,
  bAllowEnhanceStat_Attack: true,
  bAllowEnhanceStat_Weight: true,
  bAllowEnhanceStat_WorkSpeed: true,
  ItemCorruptionMultiplier: 1,
  bIsShowJoinLeftMessage: true,
  CrossplayPlatforms: '(Steam,Xbox)',
  bCharacterRecreateInHardcore: false,
  bEnableVoiceChat: false
}
