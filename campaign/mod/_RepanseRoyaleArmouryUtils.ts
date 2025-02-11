namespace RepanseRoyaleArmoury {
    export type TimerCallback = () => void
    export type VoidCallback = () => void

    const logger = new Logger("RepanseRoyaleArmoury")

    export const console = {
        log: (...s:string[]) => logger.Log(s.join(" ")),
        warn: (...s: string[]) => logger.LogWarn(s.join(" ")),
        error: (...s: string[]) => logger.LogError(s.join(" "))
    }

    export class localStorage {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        public static setItem(key: string, value: any) : void {
            cm.set_saved_value(key, value)
        }
        /**
         * @warning  use 'as' to cast it to luatable, string, number, null, etc. (yes, null is a type in TS)
         */
        public static getItem(key: string): unknown  {
            return cm.get_saved_value(key)
        }
        public static removeItem(key: string): void {
            cm.set_saved_value(key, null)
        }
    }

    /**
     * Fires when a campaign starts (or every session change from battle -> campaign)
     * @param callback 
     */
    export function OnCampaignStart(callback: VoidCallback) {
        cm.add_first_tick_callback( () => callback() )
    }
    /**
     * Clamp such that min >= v <= max 
     * @param v 
     * @param min 
     * @param max 
     * @returns 
     */
    export function clamp(v: number, min: number, max:number) : number {
        if(v >= max) return max
        if(v <= min) return min
        return v
    }
    /**
     * Generate alphanumeric random string
     * @param len how long the string is
     * @returns random alphanumeric string
     */
    export function RandomString(len: number = 10): string {
        let outString: string = '';
        const inOptions: string = 'abcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < len; i++) {
            outString += inOptions.charAt(Math.floor(Math.random() * inOptions.length));
        }

        return outString;
    }

    /** Generates multiplayer safe random integer from [lowerbound, upperbound] 
     * @param upperbound upperbound (inclusive)
     * @param lowerbound lowerbound (inclusive)
    */
    export function RandomNumber(upperbound: number = 10, lowerbound: number = 1): number {
        return cm.random_number(upperbound, lowerbound)
    }

    /** returns a single dice roll */
    export function DiceRoll(numberOfSide: number): number {
        return RandomNumber(numberOfSide, 1)
    }

    /** choose random element in an array  
     * should be multiplayer safe
     * @returns if array is empty, null is returned
     */
    export function ChooseRandom(array: unknown[]): unknown | null {
        if(array.length == 0) return null
        const index = RandomNumber(array.length - 1, 0)
        return array[index]
    }
    
    /**
     * Rolls a xDy dice. For example 2D5 > 10 (the threshold)? 
     * @param threshold total points 
     * @param numberOfDice how many dices to be rolled
     * @param numberOfSide number of side on a dice
     */
    export function IsDiceRollSucess(threshold: number, numberOfDices: number, numberOfSide: number): boolean {
        let result = 0
        for (let i = 0; i < numberOfDices; i++) {
            result += DiceRoll(numberOfSide)            
        }
        return result >= threshold
    }

    /**
     * Returns true or false. 50% chance
     */
    export function IsTrueOrFalse(): boolean {
        return IsDiceRollSucess(50, 1, 100)
    }

    /** returns the current turn number */
    export function GetTurnNumber(): number {
        return cm.turn_number()
    }

    /**
     * Override the battle environment of upcoming battles.
     * @param fileName 	The file path of the battle environment file. E.g. "weather/battle/wh_day_clear_02.environment_group"
     */
    export function SetBattleLightingOverride(fileName: string): void {
        cm.set_battle_lighting_env_override(fileName)
    }

    /**
     * Clears battle ligthing settings.
     */
    export function ClearBattleLightingOverride(): void {
        cm.set_battle_lighting_env_override()
    }

    export function PerformanceCounterBegin(): number {
        return os.clock() * 1000
    }

    export function PerformanceCounterEnd(): number {
        return os.clock() * 1000
    }

    /**
     * Gets difficulty level for local player
     * @returns current difficulty level, the lower the number, the easier
     */
    export function GetCampaignDifficultyLocal(): number {
        return cm.model().difficulty_level()
    }

    export function IsMultiplayer(): boolean {
        return cm.model().is_multiplayer()
    }
    
    /**
     * Matches string based on a pattern. Subtitute for javascript regex
     * @param input string to find the patterns
     * @param pattern lua regex pattern
     * @returns lua regex capture groups
     */
    export function LuaStringMatcher(input: string, pattern: string): string[] {
        const matcher = string.gmatch(input, pattern)
        return matcher()
    }

    export function IsFileExistVFS(filenameWithPath: string) {
        return common.vfs_exists(filenameWithPath)
    }
    
    class TimedCallback {
        private id = 0
        private interval = 0
        private identifier = ""
        private callback : TimerCallback

        constructor(id: number, identifier: string, interval: number, callback: TimerCallback) { 
            this.id = id
            this.identifier = identifier
            this.interval = interval
            this.callback = callback
        }

        
        public get Interval() : number {
            return this.interval
        }

        
        public get Identifier() : string {
            return this.identifier
        }
        
        
        public get Id() : number {
            return this.id
        }

        public Execute() : void {
            this.callback()
        }
        
    }
        
    class TimerManager {
        private readonly instanceNr = Math.floor(Math.random() * Math.random() * 9999999)
        private readonly identifier = `TimerManager Typescript instance nr ${this.instanceNr}`
        private static instance : TimerManager
        private callbacks: LuaMap<string, TimedCallback> = new LuaMap
        private readonly l = new Logger(`TimerManager instance nr: ${this.instanceNr}`)

        private constructor(){
            core.add_listener(
                this.identifier,
                "RealTimeTrigger",
                (context) => this.callbacks.has(context.string ?? ""),
                (context) => {
                    try {
                        const contextStr = context.string ? context.string : ""

                        const callbackObject = this.callbacks.get(contextStr)
                        if(callbackObject == null) return

                        callbackObject.Execute()
                        if(contextStr.indexOf("_ONCE") >= 0) this.Kill(callbackObject.Id)
                    } catch (error) {
                        this.l.LogError(error as string)
                    }
                }, 
                true
            )
            this.l.Log(`TimerManager with instance name "${this.identifier}" has started`)
            this.l.Log(`called from \n ${debug.traceback("", 1)}`)
        }

        public Kill(id: number): boolean {
            const target = `${this.identifier}_${id}`
            if(this.callbacks.has(target))
            {
                this.callbacks.delete(target)
                real_timer.unregister(target)
                return true
            }

            const targetOnce = `${target}_ONCE`
            if(this.callbacks.has(targetOnce))
            {
                this.callbacks.delete(targetOnce)
                real_timer.unregister(targetOnce)
                return true
            }

            return false
        }

        public RegisterSingleShot(callback: TimerCallback, intervalInMs: number): number {
            const id = Math.floor(Math.random() * Math.random() * 9999999)
            const identifier = `${this.identifier}_${id}_ONCE`
            this.callbacks.set(identifier, new TimedCallback(id, identifier, intervalInMs, callback))
            real_timer.register_singleshot(identifier, intervalInMs)
            return id
        }

        public RegisterRepeating(callback: TimerCallback, intervalInMs: number): number {
            const id = Math.floor(Math.random() * Math.random() * 9999999)
            const identifier = `${this.identifier}_${id}`
            this.callbacks.set(identifier, new TimedCallback(id, identifier, intervalInMs, callback))
            real_timer.register_repeating(identifier, intervalInMs)
            return id
        }

        public static get Instance(): TimerManager
        {
            return this.instance || (this.instance = new this())
        }
    }

    /**
     * The global setTimeout() method sets a timer which executes a function or specified piece of code once the timer expires.
     * @param callback A function to be executed after the timer expires.
     * @param inMilliSecond The time, in milliseconds that the timer should wait before the specified function or code is executed. If this parameter is omitted, a value of 0 is used, meaning execute "immediately", or more accurately, the next event cycle.
     * @returns The returned timeoutID is a positive integer value which identifies the timer created by the call to setTimeout(). This value can be passed to clearTimeout() to cancel the timeout.
     */
    export function setTimeout(callback: TimerCallback, inMilliSecond: number = 0): number {
        return TimerManager.Instance.RegisterSingleShot(callback, inMilliSecond)
    }
    /**
     * The setInterval() method, offered on the `real_timer` interface, repeatedly calls a function or executes a code snippet, with a fixed time delay between each call.
     * This method returns an interval ID which uniquely identifies the interval, so you can remove it later by calling clearInterval().
     * @param callback A function to be executed every delay milliseconds. The first execution happens after delay milliseconds.
     * @param inMilliSecond The time, in milliseconds (thousandths of a second), the timer should delay in between executions of the specified function or code. Defaults to 10 if not specified, lowest value is 10 
     * @returns The returned intervalID is a numeric, non-zero value which identifies the timer created by the call to setInterval(); this value can be passed to clearInterval() to cancel the interval.
     */
    export function setInterval(callback: TimerCallback, inMilliSecond: number = 10): number {
        inMilliSecond <= 10 ? inMilliSecond = 10 : inMilliSecond
        return TimerManager.Instance.RegisterRepeating(callback, inMilliSecond)
    }
    /**
     * 
     * @param id The global clearInterval() method cancels a timed, repeating action which was previously established by a call to setInterval(). If the parameter provided does not identify a previously established action, this method does nothing.
     * @returns true if clear was successful
     */
    export function clearInterval(id: number): boolean {
        return TimerManager.Instance.Kill(id)
    }

    
    /**
     * DO NOT USE THIS FUNCTION UNLESS YOU'RE 100% THE OBJECT IS COMPATIBLE AND CASTABLE TO THE TARGET CLASS
     * Overusing this defeats the point of using Typescript.
     * @param x Object
     * @returns 
     */
    export function TrustMeThisCast<T>(x: unknown): T {
        return x as T;
    }
}