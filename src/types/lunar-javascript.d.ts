declare module 'lunar-javascript' {
  export class Lunar {
    static fromDate(date: Date): Lunar;
    static fromYmd(year: number, month: number, day: number): Lunar;
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getMonth(): number;
    getDay(): number;
    getSolar(): Solar;
  }

  export class Solar {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
  }
} 