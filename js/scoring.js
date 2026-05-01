// Score, level, and line tracking.

class Scoring {
  constructor() {
    this.reset();
  }

  reset() {
    this.score = 0;
    this.level = 1;
    this.lines = 0;
  }

  // Award points for clearing lines. Returns the number of lines cleared.
  awardLines(count) {
    if (count <= 0) return count;
    this.score += LINE_SCORES[Math.min(count, 4)] * this.level;
    this.lines += count;
    const newLevel = Math.floor(this.lines / LINES_PER_LEVEL) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      return count; // level changed
    }
    return count;
  }

  // Award points for soft/hard dropping.
  awardDrop(points) {
    this.score += points;
  }

  // Returns true if level changed.
  didLevelUp() {
    return this.level === Math.floor(this.lines / LINES_PER_LEVEL) + 1;
  }

  getGravityInterval() {
    return getGravityInterval(this.level);
  }
}
