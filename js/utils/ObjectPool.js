/**
 * Object Pool Generik untuk entitas game
 * Mengurangi beban garbage collection dengan menggunakan kembali objek
 */
export class ObjectPool {
  constructor(ClassType, initialSize = 50) {
    this.ClassType = ClassType;
    this.pool = [];
    this.active = [];
    this.initialSize = initialSize;
    
    // Jangan alokasi awal - objek butuh parameter konstruktor
    // Akan dibuat sesuai permintaan di acquire()
  }

  /**
   * Mengambil objek dari pool
   * @param {...any} args - Argumen konstruktor untuk objek
   * @returns {Object} Objek yang digunakan kembali atau baru
   */
  acquire(...args) {
    let obj;
    
    if (this.pool.length > 0) {
      obj = this.pool.pop();
      // Reset objek dengan parameter baru
      if (obj.reset) {
        obj.reset(...args);
      } else {
        // Fallback: inisialisasi ulang secara manual
        Object.assign(obj, new this.ClassType(...args));
      }
    } else {
      // Pool habis, buat objek baru
      obj = new this.ClassType(...args);
    }
    
    this.active.push(obj);
    return obj;
  }

  /**
   * Mengembalikan objek ke pool
   * @param {Object} obj - Objek yang akan dilepas
   */
  release(obj) {
    const index = this.active.indexOf(obj);
    if (index > -1) {
      this.active.splice(index, 1);
      this.pool.push(obj);
    }
  }

  /**
   * Melepaskan semua objek aktif kembali ke pool
   */
  releaseAll() {
    // Reset flag markedForDeletion untuk semua objek aktif
    for (const obj of this.active) {
      obj.markedForDeletion = false;
    }
    this.pool.push(...this.active);
    this.active = [];
  }

  /**
   * Memperbarui semua objek aktif
   * @param {number} dt - Delta time (waktu yang berlalu)
   */
  updateAll(dt) {
    // Iterasi terbalik untuk penghapusan yang aman
    for (let i = this.active.length - 1; i >= 0; i--) {
      const obj = this.active[i];
      obj.update(dt);
      
      if (obj.markedForDeletion) {
        this.release(obj);
      }
    }
  }

  /**
   * Menggambar semua objek aktif
   * @param {CanvasRenderingContext2D} ctx - Konteks kanvas
   */
  drawAll(ctx) {
    for (const obj of this.active) {
      obj.draw(ctx);
    }
  }

  /**
   * Mendapatkan semua objek aktif
   * @returns {Array} Daftar objek aktif
   */
  getActive() {
    return this.active;
  }

  /**
   * Mendapatkan statistik pool
   * @returns {Object} Statistik pool (pooled, active, total)
   */
  getStats() {
    return {
      pooled: this.pool.length,
      active: this.active.length,
      total: this.pool.length + this.active.length
    };
  }
}
