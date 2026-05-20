/**
 * Money Utility Class
 * Centralizes all microcoin calculations to prevent floating point inaccuracies
 * and scaling drift in the VOZ Ledger.
 * 
 * 1 Coin = 1000 Microcoins.
 * Internal representation uses BigInt.
 */
export class Money {
    private readonly microcoins: bigint;

    private constructor(microcoins: bigint) {
        this.microcoins = microcoins;
    }

    /**
     * Create Money instance from a standard decimal coin amount (e.g. 5.50 coins)
     */
    public static fromCoins(coins: number | string): Money {
        const val = typeof coins === 'string' ? parseFloat(coins) : coins;
        if (isNaN(val) || !isFinite(val)) {
            throw new Error(`Invalid coins amount: ${coins}`);
        }
        return new Money(BigInt(Math.round(val * 1000)));
    }

    /**
     * Create Money instance from raw microcoins
     */
    public static fromMicrocoins(microcoins: bigint | number): Money {
        return new Money(BigInt(microcoins));
    }

    /**
     * Return a zero Money instance
     */
    public static zero(): Money {
        return new Money(BigInt(0));
    }

    /**
     * Convert to standard decimal coin amount
     */
    public toCoins(): number {
        return Number(this.microcoins) / 1000.0;
    }

    /**
     * Convert to raw BigInt microcoins for database storage
     */
    public toMicrocoins(): bigint {
        return this.microcoins;
    }

    /**
     * Convert to standard number representation of microcoins
     */
    public toMicrocoinsNumber(): number {
        return Number(this.microcoins);
    }

    /**
     * Add two Money amounts
     */
    public add(other: Money): Money {
        return new Money(this.microcoins + other.microcoins);
    }

    /**
     * Subtract two Money amounts
     */
    public subtract(other: Money): Money {
        return new Money(this.microcoins - other.microcoins);
    }

    /**
     * Calculates percentage split and returns [systemShare, creatorShare]
     * System share is calculated based on systemPercentage.
     * Creator share is the exact remainder.
     * This guarantees that systemShare + creatorShare = total amount (no pennies lost).
     */
    public calculateSplit(systemPercentage: number): [Money, Money] {
        if (systemPercentage < 0 || systemPercentage > 1) {
            throw new Error(`System commission percentage must be between 0 and 1: ${systemPercentage}`);
        }
        // Multiply by 1,000,000 for high precision percentage arithmetic
        const pctBig = BigInt(Math.round(systemPercentage * 1000000));
        const systemShareMicro = (this.microcoins * pctBig) / BigInt(1000000);
        const creatorShareMicro = this.microcoins - systemShareMicro;
        return [new Money(systemShareMicro), new Money(creatorShareMicro)];
    }

    public toString(): string {
        return `${this.toCoins().toFixed(3)} Coins (${this.microcoins} microcoins)`;
    }
}
