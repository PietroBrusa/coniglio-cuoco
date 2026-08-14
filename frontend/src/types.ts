/**
 * Tipi condivisi dell'applicazione: alimenti, livelli, misurazioni e sessione.
 *
 * Le forme dei dati che viaggiano verso il backend non sono ridefinite qui: sono
 * importate dal client generato dallo spec OpenAPI e solo rinominate, così esiste
 * una sola fonte di verità dal DTO NestJS fino al componente React.
 *
 * @module
 */

/** Alimento proposto al bambino, scelto in fase di setup. */
export interface Food {
  /** Identificativo stabile usato per raggruppare le sessioni, es. `mela-verde`. */
  id: string;
  /** Nome mostrato nell'interfaccia, es. `Mela verde`. */
  label: string;
  /** Emoji usata come bersaglio a schermo e nelle liste. */
  emoji: string;
}

/**
 * Meccanica del livello: `hold` conta il tempo di contatto mantenuto.
 *
 * È un tipo a un valore solo, e resta un tipo perché il valore viene copiato in
 * ogni esito salvato: dice a chi rileggerà i dati in quali termini quella misura
 * è stata raccolta, senza doverlo dedurre dal nome del livello.
 */
export type LevelMode = 'hold';

/**
 * Modalità scelta a inizio sessione.
 *
 * - `facile`: il bambino tocca liberamente per tutta la finestra. È la sola
 *   modalità che misura, e quindi la sola che finisce nel database;
 * - `difficile`: il contatto vale solo quando l'alimento si illumina (vedi
 *   {@link HardBeat}). È **solo gioco**: non registra misurazioni, non viene
 *   salvata e non compare in grafici ed esportazioni (vedi
 *   {@link domain/sessionRecord.collectsData}).
 *
 * Nei record salvati il valore è quindi sempre `facile`. Viene comunque scritto:
 * una scheda ABA che non dice in quale condizione il dato è stato raccolto non è
 * interpretabile, nemmeno quando la condizione è una sola.
 */
export type Difficulty = 'facile' | 'difficile';

/**
 * Come si guadagna il punto in modalità difficile.
 *
 * - `tap`: basta toccare mentre la finestra è accesa;
 * - `hold`: bisogna mantenere il contatto per tutta la finestra.
 */
export type BeatScore = 'tap' | 'hold';

/**
 * Ritmo della modalità difficile: quanto resta accesa la finestra utile, quanto
 * dura la pausa e come si assegna il punto.
 *
 * Gli intervalli `[min, max]` vengono campionati a ogni ciclo da
 * {@link domain/hardBeat.sampleBeatMs}: con `min === max` il ritmo è fisso e
 * prevedibile, altrimenti cambia a ogni battuta e non si può anticipare a memoria.
 */
export interface HardBeat {
  /** Durata della finestra accesa, in millisecondi: `[minimo, massimo]`. */
  onMs: [number, number];
  /** Pausa tra una finestra e la successiva, in millisecondi: `[minimo, massimo]`. */
  offMs: [number, number];
  /** Criterio di assegnazione del punto. */
  score: BeatScore;
  /**
   * Finestre da centrare per completare il livello: riempie la barra di
   * avanzamento ed è la condizione della terza stella.
   *
   * È il criterio del gioco in modalità difficile, al posto del tempo di
   * contatto: lì il contatto continuo non è una prestazione ma il modo per
   * *evitare* il compito, e premiarlo renderebbe la modalità a tempo superabile
   * senza mai rispondere a tempo.
   */
  beatTarget: number;
}

/**
 * Un passo della gerarchia di esposizione all'alimento.
 *
 * I livelli sono dati, non codice sparso nelle schermate: aggiungerne uno
 * significa aggiungere un elemento all'array `LEVELS`.
 */
export interface Level {
  /** Numero progressivo del livello, dall'esposizione più leggera alla più impegnativa. */
  id: number;
  /** Nome narrativo mostrato al bambino, es. `L'Annusata`. */
  name: string;
  /**
   * Definizione operazionale del comportamento target, es.
   * «Sollevare e avvicinare al viso, annusare».
   *
   * Viene salvata nel record della sessione: chi rileggerà i dati fra un anno
   * saprà esattamente che cosa è stato misurato.
   */
  behavior: string;
  /** Meccanica di conteggio del livello. */
  mode: LevelMode;
  /**
   * Durata della finestra di misura in secondi, e insieme obiettivo di contatto
   * della barra di avanzamento.
   */
  target: number;
  /** Parametri del ritmo usati solo in modalità difficile. */
  hardBeat: HardBeat;
  /** Narrazione introduttiva, adattata all'alimento scelto. */
  intro: (ctx: { foodLabel: string }) => string;
  /** Suggerimento breve mostrato durante il gioco. */
  hint: string;
  /** Etichetta della barra di avanzamento, es. `Profumo 43%`. */
  progressLabel: (done: number, target: number) => string;
}

/**
 * Espressione del coniglio. Cambia con il contatto in corso e dà al bambino un
 * riscontro immediato e non verbale del proprio comportamento.
 */
export type RabbitMood = 'idle' | 'happy' | 'sniff' | 'eat' | 'cheer';

import type { TouchRecordDto, LevelResultMetricsDto, LevelResultDto } from '@/api/generated';

/** Un singolo contatto, con tempi relativi al primo contatto della finestra. */
export type TouchRecord = TouchRecordDto;
/** Metriche di un livello, nella forma in cui vengono salvate. */
export type LevelResultMetrics = LevelResultMetricsDto;
/** Esito di un livello: identità del livello più le sue metriche. */
export type LevelResult = LevelResultDto;

/**
 * Misurazioni di un livello, calcolate da {@link domain/computeMetrics.computeMetrics}.
 *
 * Differisce da {@link LevelResultMetrics} (la forma salvata) per due campi di
 * sola visualizzazione: `count` vi si chiama `n`, e `liveContactMs` non viene
 * persistito.
 */
export interface Metrics {
  /** Numero di contatti conclusi: la frequenza del comportamento. */
  count: number;
  /**
   * Millisecondi tra l'inizio della fase di gioco e il primo contatto.
   * `null` se il bambino non ha mai toccato l'alimento.
   */
  latencyMs: number | null;
  /** Somma delle durate di tutti i contatti. */
  totalContactMs: number;
  /**
   * Contatto totale più quello eventualmente ancora aperto.
   * Serve solo alla barra di avanzamento in tempo reale, non viene salvato.
   */
  liveContactMs: number;
  /** Durata media di un contatto; `null` senza contatti. */
  meanTouchMs: number | null;
  /**
   * *Inter-Response Time* medio: tempo che intercorre tra la fine di un contatto
   * e l'inizio del successivo. `null` con meno di due contatti.
   */
  meanIrtMs: number | null;
  /** Durata della finestra di misura, fissata dal livello (non il tempo reale trascorso). */
  sessionDurationMs: number;
  /**
   * Percentuale di tempo trascorsa a contatto con l'alimento, saturata a 100.
   * È la metrica principale: il valore riportato sul grafico ABA e confrontato
   * con la linea di criterio.
   */
  engagementRatio: number;
  /** Dati grezzi: ogni contatto registrato, per ricalcolare qualsiasi metrica. */
  touches: TouchRecordDto[];
}

/**
 * Una sessione di lavoro completa: un bambino, un alimento, i tre livelli e le
 * osservazioni del terapista.
 *
 * Viene scritta nel database una sola volta, a sessione conclusa, così il record
 * arriva completo di comportamenti problema e note.
 */
export interface Session {
  /** Bambino a cui appartiene la sessione. Lato server viene imposto dal token. */
  childId: string;
  /** Numero progressivo della sessione per quel bambino su quell'alimento. */
  sessionNumber: number;
  /** Nome dell'alimento, come mostrato nell'interfaccia. */
  food: string;
  /** Identificativo dell'alimento: è la chiave con cui se ne raggruppa lo storico. */
  foodId: string;
  /** Condizione sperimentale della sessione; nei record salvati sempre `facile`. */
  difficulty: Difficulty;
  /** Nome dell'operatore; stringa vuota se non registrato. */
  therapist: string;
  /** Identificativi dei comportamenti problema osservati (vedi `PROBLEM_BEHAVIORS`). */
  problemBehaviors: string[];
  /** Osservazioni libere del terapista; stringa vuota se non ne ha scritte. */
  notes: string;
  /** Data e ora di inizio, in formato ISO 8601. */
  date: string;
  /** Esito di ogni livello completato, nell'ordine in cui è stato eseguito. */
  levels: LevelResult[];
}
