declare namespace BretonniaInGameKitbash {
    /**
     * Gets all the faction in the campaign. If this fires for the first time, it will take time to caches first.
     * @returns Array of Wrapped IFactionScript in Faction object
     */
    function GetFactions(): Faction[];
    /**
     * Get a wrapped IFactionScript inside Faction class given a faction key.
     * @param factionKey faction key from faction table
     * @returns Faction object or null if such key was not found
     */
    function GetFactionByKey(factionKey: string): Faction | undefined;
    /**
     *  Get a wrapped IFactionScript inside Faction class given an IFactionScript object
     * @param faction
     * @returns
     */
    function WrapIFactionScriptToFaction(faction: IFactionScript): Faction | undefined;
    class Faction {
        static readonly CachedFactions: Faction[];
        static GetFactions(): Faction[];
        private factionInterface;
        /**
         * Wraps IFactionScript object into Faction object so you can manipulate and query this faction with OOP style (no need to touch cm API again)
         * PRIVATE. Use WrapIFactionScriptToFaction(), GetFactions(), or GetFactionByKey() instead.
         * @param faction IFactionScript
         * @throws execption if the user puts invalid IFactionScript object (i.e if it's INullScript)
         */
        private constructor();
        /**
         * Removes effect budle from this faction
         * @param effectBundleKey effect bundle key from effect bundle table
         */
        RemoveEffectBundle(effectBundleKey: string): void;
        /**
         * Trigger a dillema associated with this faction
         * @param dillemaKey Dilemma key, from the dilemmas table.
         */
        TriggerDilemma(dillemaKey: string): boolean;
        /**
         * Check if this faction is human
         * @returns true if human
         */
        get IsHuman(): boolean;
        /**
         * Returns faction leader character
         * @returns may return null if faction is dead or invalid
         */
        get FactionLeader(): Character | null;
        /**
         *  Check if this faction is dead
         * @returns true if dead
         */
        get IsDead(): boolean;
        /**
         * Gets internal IFactionScript referenced by this wrapper
         * @returns IFactionScript
         */
        GetFactionInterface(): IFactionScript;
        /**
         * Check if the internal IFactionScript is valid
         * @returns true if still valid
         */
        IsValid(): boolean;
        /** returns faction culture */
        get Culture(): string;
        /**
         * Constructs and displays an event for this faction. This wraps the cm.show_message_event function of the same name on the underlying episodic_scripting, although it provides input validation, output, whitelisting and a progression callback.
         * @param titleLocKey Localisation key for the event title. This should be supplied in the full `[table]_[field]_[key]` localisation format, or can be a blank string.
         * @param primaryLocKey Localisation key for the primary detail of the event. This should be supplied in the full `[table]_[field]_[key]` localisation format, or can be a blank string.
         * @param secondaryLocKey Localisation key for the secondary detail of the event. This should be supplied in the full `[table]_[field]_[key]` localisation format, or can be a blank string.
         * @param isPersistent Sets this event to be persistent instead of transient.
         * @param index Index indicating the type of event.
         * @param endCallback optional, default value=false Specifies a callback to call when this event is dismissed. Note that if another event message shows first for some reason, this callback will be called early.
         * @param callbackDelay optional, default value=0 Delay in seconds before calling the end callback, if supplied.
         * @param dontWhitelist optional, default value=false By default this function will whitelist the scripted event message type with campaign_manager.whitelist_event_feed_event_type. Set this flag to true to prevent this.
         */
        ShowMessageEvent(titleLocKey: string, primaryLocKey: string, secondaryLocKey: string, isPersistent: boolean, index: number, endCallback?: () => void, callbackDelay?: number, dontWhitelist?: boolean): void;
        /**
         * Applies an effect bundle to this faction for a number of turns (can be infinite)
         * @param effectBundleKey Effect bundle key from the effect bundles table.
         * @param turns Number of turns to apply the effect bundle for. Supply 0 here to apply the effect bundle indefinitely (it can be removed later with `.RemoveEffectBundle` if required).
         */
        ApplyEffectBundle(effectBundleKey: string, turns?: number): void;
        HasEffectBundle(effectBundleKey: string): boolean;
        /**
         * Registers a turn countdown event for this faction. The supplied script event will be triggered after the specified number of turns has passed, when the FactionTurnStart event is received for the specified faction.
         * @param turns Number of turns from now to trigger the event.
         * @param event Event to trigger. By convention, script event names begin with "ScriptEvent"
         * @param contextString optional, default value="" Optional context string to trigger with the event.
         */
        AddTurnCountdownEvent(turns: number, event: string, contextString: string): void;
        /**
         * Trigger a mission from this faction
         * @param missionKey Mission key from Mission tables
         * @param fireImmediately start the mission immediately after this method is fired
         */
        TriggerMission(missionKey: string, fireImmediately?: boolean): void;
        /**(Getter) gets all lords and champions, wrap them in generic Character class */
        get Characters(): Character[];
        /**(Getter) Gets all lords in this faction, wrapped in Lord class */
        get Lords(): Lord[];
        get Champions(): Champion[];
        /**(Getter) array of effect bundle keys on this faction */
        get EffectBundles(): string[];
        /**(Getter) get faction key */
        get FactionKey(): string;
        toString(): string;
        /**
         * Rather than doing this factionA == factionB (although both instances have the same reference, the objects wrapper are still different), use this method to check if both object is equal
         * @param otherFaction
         * @returns
        */
        IsEqual(otherFaction: Faction): boolean;
    }
}
