// Motor determinístico da simulação Sanepar OT & Lakehouse (JS puro, sem DOM nem Three.js).
// A cena 3D e os contadores da interface apenas leem o estado exposto por esta classe.
import { DT, SEED, SIM_RATES, NIGHT_PHASES } from '../config.js';
import { EventBus } from './EventBus.js';

const SAMPLE_TAGS = [
  { uid: 'SNP-CTB-CAP01-FT01', domain: 'captacao', parque: 'Próprio SCADA (1m)', unid: 'L/s', base: 420.0, amp: 18.0, dest: 'Trusted Telemetria' },
  { uid: 'SNP-LON-POC18-LT01', domain: 'poco', parque: 'Terceiros (120s)', unid: 'm', base: 64.5, amp: 3.2, dest: 'Trusted Telemetria' },
  { uid: 'SNP-CTB-ETA02-FT04', domain: 'eta', parque: 'Próprio SCADA (1m)', unid: 'L/s', base: 395.0, amp: 12.5, dest: 'Trusted Telemetria' },
  { uid: 'SNP-CTB-RES04-LT01', domain: 'reservatorio', parque: 'Terceiros (120s)', unid: 'm', base: 4.12, amp: 0.35, dest: 'Trusted Telemetria' },
  { uid: 'SNP-CTB-EEA12-KFF01', domain: 'elevatoria', parque: 'Próprio SCADA (1m)', unid: 'status', base: 1, amp: 0, dest: 'Refined Energia (D6)' },
  { uid: 'SNP-CTB-DMC08-PT03', domain: 'rede_vrp', parque: 'Terceiros (120s)', unid: 'mca', base: 34.5, amp: 2.8, dest: 'Refined Pressão (D4)' },
  { uid: 'SNP-MGA-VRP14-PT02', domain: 'rede_vrp', parque: 'Terceiros (120s)', unid: 'mca', base: 29.8, amp: 2.1, dest: 'Refined Pressão (D4)' },
  { uid: 'SNP-PGU-EEA07-KFF02', domain: 'elevatoria', parque: 'Próprio SCADA (1m)', unid: 'status', base: 1, amp: 0, dest: 'Refined Energia (D6)' },
  { uid: 'SNP-CSC-DMC03-FT01', domain: 'rede_vrp', parque: 'Terceiros (120s)', unid: 'L/s', base: 72.4, amp: 6.1, dest: 'Refined Pressão (D4)' },
];

// Todas as 14 rotas de telemetria dos múltiplos devices espalhados pela Cidade 3D
export const FIELD_SOURCE_ROUTES = [
  { route: 'cap_cloud', pulseKey: 'captacao', kind: 'hot' },
  { route: 'poco1_cloud', pulseKey: 'poco', kind: 'hot' },
  { route: 'poco2_cloud', pulseKey: 'poco', kind: 'hot' },
  { route: 'eta_rtu', pulseKey: 'eta', kind: 'hot' },
  { route: 'res1_rtu', pulseKey: 'reservatorio', kind: 'hot' },
  { route: 'res2_cloud', pulseKey: 'reservatorio', kind: 'hot' },
  { route: 'res3_cloud', pulseKey: 'reservatorio', kind: 'hot' },
  { route: 'eea1_rtu', pulseKey: 'elevatoria', kind: 'use' },
  { route: 'eea2_cloud', pulseKey: 'elevatoria', kind: 'use' },
  { route: 'vrp1_rtu', pulseKey: 'rede_vrp', kind: 'hot' },
  { route: 'vrp2_cloud', pulseKey: 'rede_vrp', kind: 'hot' },
  { route: 'vrp3_cloud', pulseKey: 'rede_vrp', kind: 'hot' },
  { route: 'dmc1_cloud', pulseKey: 'setor_manobra', kind: 'hot' },
  { route: 'dmc2_cloud', pulseKey: 'setor_manobra', kind: 'hot' },
];

export class DataFlowSimulator {
  constructor() {
    this.bus = new EventBus();
    this.running = true;
    this.speed = 1;
    this.reset();
  }

  reset() {
    this.tick = 0;
    this.time = 0;
    this.acc = 0;
    this._rngState = SEED;
    this._pktSeq = 0;
    this._tagIdx = 0;
    this._fieldWaveIdx = 0;

    this._tTerceiros = 0.6;
    this._tProprio = 0.3;
    this._tIceberg = 1.2;
    this._tFieldPulse = 0.1;

    this.night = {
      active: false,
      phaseIndex: -1,
      phaseElapsed: 0,
      phaseProgress: 0,
      current: null,
      completedRuns: 0,
    };

    this.fieldPackets = [];
    this.lakePackets = [];

    this.fieldState = {
      reservoirLevel: 0.74,
      pumpActive: true,
      vrpPressureMca: 34.8,
      sensorPulse: {
        captacao: 0,
        poco: 0,
        eta: 0,
        reservatorio: 0,
        elevatoria: 0,
        rede_vrp: 0,
        setor_manobra: 0,
        rtu: 0,
        dhuo: 0,
      },
    };

    this.counters = {
      sessionReads: 0,
      terceirosCycles: 0,
      proprioCycles: 0,
      parquetPendingFiles: 8,
      icebergCommits: 0,
      dataformWorkflows: 0,
      assertionsChecked: 40,
      refinedDeliveries: 0,
      sampleTag: this._nextSampleTag(),
    };

    this._spawnHotWave();
    for (let k = 0; k < 6; k++) this._spawnFieldWave();
    for (let i = 0; i < 45; i++) this._stepFixed(DT);

    this.bus.emit('sim:reset');
  }

  _rand() {
    let t = (this._rngState += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  _nextSampleTag() {
    const tpl = SAMPLE_TAGS[this._tagIdx % SAMPLE_TAGS.length];
    this._tagIdx++;
    const delta = (this._rand() - 0.5) * 2 * tpl.amp;
    const val =
      tpl.unid === 'status'
        ? 'ENERGIZADO (1)'
        : `${(tpl.base + delta).toFixed(1).replace('.', ',')} ${tpl.unid}`;
    return {
      uid: tpl.uid,
      parque: tpl.parque,
      valor: val,
      dest: tpl.dest,
    };
  }

  setRunning(v) {
    const next = !!v;
    if (this.running === next) return;
    this.running = next;
    this.bus.emit('run:change', this.running);
  }

  setSpeed(mult) {
    const m = Math.max(0.25, Math.min(4, Number(mult) || 1));
    if (this.speed === m) return;
    this.speed = m;
    this.bus.emit('speed:change', this.speed);
  }

  startNightCycle() {
    this.night.active = true;
    this.night.phaseIndex = 0;
    this.night.phaseElapsed = 0;
    this.night.phaseProgress = 0;
    this.night.current = NIGHT_PHASES[0];
    if (!this.running) this.setRunning(true);
    this._onEnterNightPhase(NIGHT_PHASES[0]);
    this.bus.emit('night:change', this.night);
  }

  stopNightCycle() {
    if (!this.night.active) return;
    this.night.active = false;
    this.night.phaseIndex = -1;
    this.night.current = null;
    this.night.phaseProgress = 0;
    this.bus.emit('night:change', this.night);
  }

  advance(realDt) {
    if (!this.running) return;
    this.acc += Math.min(0.25, Math.max(0, realDt)) * this.speed;
    while (this.acc >= DT) {
      this._stepFixed(DT);
      this.acc -= DT;
    }
  }

  _stepFixed(dt) {
    this.tick++;
    this.time += dt;

    this.fieldState.reservoirLevel = 0.72 + 0.08 * Math.sin(this.time * 0.35);
    this.fieldState.vrpPressureMca = 34.5 + 1.8 * Math.sin(this.time * 0.6 + 1.1);
    for (const k of Object.keys(this.fieldState.sensorPulse)) {
      this.fieldState.sensorPulse[k] = Math.max(0, this.fieldState.sensorPulse[k] - dt * 1.5);
    }

    // Avança pacotes da cena 1 (Cidade 3D -> Nuvem)
    const fieldRate = 1 / SIM_RATES.packetTransitSec;
    for (let i = this.fieldPackets.length - 1; i >= 0; i--) {
      const p = this.fieldPackets[i];
      p.t += dt * fieldRate * (p.speed || 1);
      if (p.t >= 1) {
        if (p.route.endsWith('_rtu')) {
          this.fieldState.sensorPulse.rtu = 1;
          this._spawnFieldPacket('rtu_dhuo', p.kind, 1.05);
        } else if (p.route === 'rtu_dhuo' || p.route.endsWith('_cloud')) {
          this.fieldState.sensorPulse.dhuo = 1;
          this._spawnFieldPacket('dhuo_gcp', p.kind, 1.15);
        }
        this.fieldPackets.splice(i, 1);
      }
    }

    // Avança pacotes da cena 2 (Lakehouse)
    const lakeRate = 1 / SIM_RATES.packetTransitSec;
    for (let i = this.lakePackets.length - 1; i >= 0; i--) {
      const p = this.lakePackets[i];
      p.t += dt * lakeRate * (p.speed || 1);
      if (p.t >= 1) {
        this._onLakePacketArrived(p);
        this.lakePackets.splice(i, 1);
      }
    }

    // Dispara ondas frequentes de múltiplos devices da cidade (a cada ~0.28s)
    this._tFieldPulse += dt;
    if (this._tFieldPulse >= 0.28) {
      this._tFieldPulse -= 0.28;
      this._spawnFieldWave();
    }

    // Coletor Terceiros (Dataflow streaming 120s)
    this._tTerceiros += dt;
    if (this._tTerceiros >= SIM_RATES.terceirosCycleSec) {
      this._tTerceiros -= SIM_RATES.terceirosCycleSec;
      this.counters.terceirosCycles++;
      this.counters.sessionReads += SIM_RATES.terceirosBatchReads;
      this.counters.parquetPendingFiles = Math.min(64, this.counters.parquetPendingFiles + 8);
      this.counters.sampleTag = this._nextSampleTag();
      this._spawnHotWave();
    }

    // Coletor Parque Próprio (Cloud Run 1min)
    this._tProprio += dt;
    if (this._tProprio >= SIM_RATES.proprioCycleSec) {
      this._tProprio -= SIM_RATES.proprioCycleSec;
      this.counters.proprioCycles++;
      this.counters.sessionReads += SIM_RATES.proprioBatchReads;
      this.counters.parquetPendingFiles = Math.min(64, this.counters.parquetPendingFiles + 2);
      this.counters.sampleTag = this._nextSampleTag();
      this._spawnLakePacket('src-dhuo', 'hot', 1.15);
      this._spawnLakePacket('dhuo-quente', 'hot', 1.1);
      this._spawnLakePacket('quente-raw', 'hot', 1.05);
    }

    // Conversão Parquet -> Iceberg (10 min)
    this._tIceberg += dt;
    if (this._tIceberg >= SIM_RATES.icebergConvertSec) {
      this._tIceberg -= SIM_RATES.icebergConvertSec;
      this.counters.icebergCommits++;
      this.counters.parquetPendingFiles = Math.max(2, this.counters.parquetPendingFiles - 18);
      this._spawnLakePacket('raw-tru-ext', 'hot', 1.0);
    }

    // Máquina de estados da Madrugada (03:45 -> 05:40)
    if (this.night.active && this.night.current) {
      const phase = this.night.current;
      this.night.phaseElapsed += dt;
      this.night.phaseProgress = Math.min(1, this.night.phaseElapsed / phase.durationSec);

      if (this.tick % 32 === 0) {
        for (const lid of phase.activeLinks) {
          const kind = lid.includes('gov') || lid.includes('param') ? 'gov' : lid.includes('ref-d') ? 'use' : 'batch';
          this._spawnLakePacket(lid, kind, 1.15);
        }
      }

      if (this.night.phaseElapsed >= phase.durationSec) {
        const nextIdx = this.night.phaseIndex + 1;
        if (nextIdx < NIGHT_PHASES.length) {
          this.night.phaseIndex = nextIdx;
          this.night.phaseElapsed = 0;
          this.night.phaseProgress = 0;
          this.night.current = NIGHT_PHASES[nextIdx];
          this._onEnterNightPhase(this.night.current);
          this.bus.emit('night:change', this.night);
        } else {
          this.night.completedRuns++;
          this.stopNightCycle();
        }
      }
    }
  }

  _onEnterNightPhase(phase) {
    for (const lid of phase.activeLinks) {
      const kind = lid.includes('gov') || lid.includes('param') ? 'gov' : lid.includes('ref-d') ? 'use' : 'batch';
      this._spawnLakePacket(lid, kind, 1.1);
    }
    if (phase.id === 'trusted_dataform') {
      this.counters.dataformWorkflows += 2;
      this.counters.assertionsChecked += 18;
    } else if (phase.id === 'refined_parametros') {
      this.counters.dataformWorkflows += 1;
      this.counters.assertionsChecked += 6;
    } else if (phase.id === 'refined_paineis') {
      this.counters.dataformWorkflows += 3;
      this.counters.assertionsChecked += 16;
      this.counters.refinedDeliveries += 3;
    }
  }

  _spawnFieldWave() {
    // Dispara 2 fontes distintas a cada pulso para manter dezenas de pacotes subindo para a nuvem
    for (let s = 0; s < 2; s++) {
      const src = FIELD_SOURCE_ROUTES[this._fieldWaveIdx % FIELD_SOURCE_ROUTES.length];
      this._fieldWaveIdx++;
      this.fieldState.sensorPulse[src.pulseKey] = 1;
      this._spawnFieldPacket(src.route, src.kind, 0.92 + (this._fieldWaveIdx % 3) * 0.12);
    }
  }

  _spawnFieldPacket(route, kind = 'hot', speed = 1) {
    if (this.fieldPackets.length > 75) return;
    this.fieldPackets.push({
      id: ++this._pktSeq,
      route,
      t: 0,
      kind,
      speed,
    });
  }

  _spawnHotWave() {
    this._spawnLakePacket('src-dhuo', 'hot', 1.05);
    this._spawnLakePacket('dhuo-quente', 'hot', 1.0);
    this._spawnLakePacket('quente-raw', 'hot', 0.95);
    this._spawnLakePacket('quente-tru', 'hot', 1.0);
  }

  _spawnLakePacket(linkId, kind = 'hot', speed = 1) {
    if (this.lakePackets.length > 65) return;
    this.lakePackets.push({
      id: ++this._pktSeq,
      linkId,
      t: 0,
      kind,
      speed,
    });
  }

  _onLakePacketArrived(pkt) {
    if (pkt.linkId === 'quente-tru' || pkt.linkId === 'raw-tru-ext') {
      this._spawnLakePacket('tru-ref-pressao', 'hot', 1.05);
      this._spawnLakePacket('tru-ref-energia', 'hot', 1.05);
    } else if (pkt.linkId === 'tru-ref-pressao') {
      this.counters.refinedDeliveries++;
      this._spawnLakePacket('ref-d4', 'use', 1.1);
      if (this.counters.refinedDeliveries % 2 === 0) this._spawnLakePacket('ref-d0', 'use', 1.05);
    } else if (pkt.linkId === 'tru-ref-energia') {
      this.counters.refinedDeliveries++;
      this._spawnLakePacket('ref-d6', 'use', 1.1);
    }
  }
}
