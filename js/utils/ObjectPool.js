/**
 * Generic Object Pool for game entities
 * Reduces garbage collection overhead by reusing objects
 */
export class ObjectPool {
  constructor(ClassType, initialSize = 50) {
    this.ClassType = ClassType;
    this.pool = [];
    this.active = [];
    this.initialSize = initialSize;
    
    // Don't pre-allocate - objects need constructor params
    // Will create on-demand in acquire()
  }

  /**
   * Get an object from the pool
   * @param {...any} args - Constructor arguments for the object
   * @returns {Object} Reused or new object
   */
  acquire(...args) {
    let obj;
    
    if (this.pool.length > 0) {
      obj = this.pool.pop();
      // Reset object with new parameters
      if (obj.reset) {
        obj.reset(...args);
      } else {
        // Fallback: manually reinitialize
        Object.assign(obj, new this.ClassType(...args));
      }
    } else {
      // Pool exhausted, create new object
      obj = new this.ClassType(...args);
    }
    
    this.active.push(obj);
    return obj;
  }

  /**
   * Return an object to the pool
   * @param {Object} obj - Object to release
   */
  release(obj) {
    const index = this.active.indexOf(obj);
    if (index > -1) {
      this.active.splice(index, 1);
      this.pool.push(obj);
    }
  }

  /**
   * Release all active objects back to pool
   */
  releaseAll() {
    // Reset markedForDeletion flag for all active objects
    for (const obj of this.active) {
      obj.markedForDeletion = false;
    }
    this.pool.push(...this.active);
    this.active = [];
  }

  /**
   * Update all active objects
   * @param {number} dt - Delta time
   */
  updateAll(dt) {
    // Reverse iteration for safe removal
    for (let i = this.active.length - 1; i >= 0; i--) {
      const obj = this.active[i];
      obj.update(dt);
      
      if (obj.markedForDeletion) {
        this.release(obj);
      }
    }
  }

  /**
   * Draw all active objects
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  drawAll(ctx) {
    for (const obj of this.active) {
      obj.draw(ctx);
    }
  }

  /**
   * Get all active objects
   * @returns {Array} Active objects
   */
  getActive() {
    return this.active;
  }

  /**
   * Get pool statistics
   * @returns {Object} Pool stats
   */
  getStats() {
    return {
      pooled: this.pool.length,
      active: this.active.length,
      total: this.pool.length + this.active.length
    };
  }
}
