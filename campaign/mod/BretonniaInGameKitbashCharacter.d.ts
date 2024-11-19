declare namespace BretonniaInGameKitbash {
    type CharacterCreationOptions = {
        characterObject?: ICharacterScript;
        factionKey?: string;
        agentSubtypeKey?: string;
        forename?: string;
        familyName?: string;
        agentType?: string;
        spawnAsAgent?: boolean;
        setAsFactionLeader?: boolean;
        regionKey?: string;
        suppressLog?: boolean;
        onFailed?: VoidCallback;
    };
    type CallbackLordCreated = {
        (theLordHimself: Lord, reason?: "CreateFromKey" | "WrappingExistingObject"): void;
    };
    type CallbackChampionCreated = {
        (theChampionHimself: Champion, reason?: "CreateFromKey" | "WrappingExistingObject"): void;
    };
    class TraitData {
        traitKey: string;
        traitLevel: number;
        traitPoints: number;
    }
    /**
     * Convert a CQI into Character
     * @param cqiNo characther command queue index number
     * @returns Character, null if cqiNo is invalid
     */
    export function FindCharacter(cqiNo: number): Character | null;
    /**
     * Converts ICharacterScript into Character
     * @param characterObject
     * @returns Character
     */
    export function WrapICharacterObjectToCharacter(characterObject: ICharacterScript): Character;
    /**
     * Converts ICharacterListScript into Array of Character
     * @param characterListObject
     * @returns
     */
    export function WrapICharacterObjectListToCharacterArray(characterListObject: ICharacterListScript): Character[];
    /**
     * Attempt to cast Character into a Champion
     * @param character character to cast
     * @returns A Champion or null if cast is failed
     */
    export function TryCastCharacterToChampion(character: Character): Champion | null;
    /**
     * Attempt to cast Character into a Lord
     * @param character A Lord or null if cast is failed
     */
    export function TryCastCharacterToLord(character: Character): Lord | null;
    /**
     * ICharacterScript wrapper. It allows you to query and manipulate your lords and heroes in OOP style rather than relying cm APIs
     */
    export class Character {
        protected CommanQueueNumberID: number;
        /**
         * Not recommended to instantiate this directly. Use `FindCharacter` or `WrapICharacterObjectToCharacter` function instead.
         * Or use `Lord` or `Champion` class instead.
         * @param options To wrap existing `ICharacterScript` object fill `option.characterObject`.
         * To create new Character for general/lord from scratch, fill these fields: `option.agentSubtypeKey`, `options.factionKey`, `options.regionKey`
         * To spawn agent, fill the same fields as above and fill these too `options.spawnAsAgent`, `options.agentType`
         * `onFailed` will be called if failed to spawn  (only when creating/spawning Agent from agentkey)
         * @throws if characterObject is a INullScript
         * @returns Wrapped ICharacterScript inside Character
         */
        constructor(options: CharacterCreationOptions);
        /**
         * Forceably adds a skill to this character.
         * @param skillKey Skill key to add from skill tables
         */
        AddSkill(skillKey: string): void;
        /**
         * Add new trait for this character
         * @param traitKey Trait key from db
         * @param showNotification Show notification "trait gained" in event panel
         * @param level set trait level
         */
        AddTrait(traitKey: string, showNotification?: boolean, level?: number): void;
        /**
         * Remove trait from this character
         * @param traitKey Trait key from db
         */
        RemoveTrait(traitKey: string): void;
        /**
         * Change the model appearance of this character
         * @param campaignArtSetKey art sed id from campaign_character_art_sets_tables table
         */
        ChangeModelAppearance(campaignArtSetKey: string): void;
        /**
         * Get the character thumbnail/2d porthole filename
         */
        get ThumbnailFileName(): string;
        /**
         * Replaces the underlying Character interface
         * @param newLord
         */
        SetInternalInterface(newLord: ICharacterScript): void;
        /**
         * Gets the underlying Character interface
         * @throws an exception if internal characterObj is null or if it's not valid
         * @returns ICharacterScript
         */
        GetInternalInterface(): ICharacterScript;
        /** gets the faction that belongs to this character, wrapped in Faction object */
        get Faction(): Faction;
        /**
         * Trigger faction incident associated with this characther
         * @param incidentKey incident key from Incident table
         */
        TriggerIncident(incidentKey: string): void;
        /**
         * Renames this character (localised)
         * @param forename Localised forename key, in the `[table]_[key]_[field]` format. example: `"names_name_1053468021"`
         * @param surname  Localised surname key, in the `[table]_[key]_[field]` format.
         * @param clanname Localised clan name key, in the `[table]_[key]_[field]` format.
         * @param othername Localised other name key, in the `[table]_[key]_[field]` format.
         */
        RenameLocalised(forename: string, surname?: string, clanname?: string, othername?: string): void;
        /**
         * Gets faction interface from the internally referenced ICharacterScript
         * @returns IFactionScript
         */
        GetFactionInterface(): IFactionScript;
        /** gets all anciliaries equipped by this character, it uses CcoCampaignFaction API to queries it */
        get AnciliaryKeys(): string[];
        /**
         * Implement Daniel's Armory system to this character (if your character has a mount, it won't work properly in battle **(IF the mount type is `war_beast`)**)
         * @param itemSetKey item set key in armory_item_sets
         * @param equipDefault Equips a default variant of each armory item (if one exists) if the target slot on the character is empty. Armory item variants are defined in the armory_item_variants database table.
         * @param clearConflictingItem Unequips any conflicting items when each item is equipped.
         * @returns any item was successfully equipped
         */
        AddArmoryItemSet(itemSetKey: string, equipDefault?: boolean, clearConflictingItem?: boolean): boolean;
        /**
        * Adds an armory item to a character.
        * @param itemKey Key for armory item to equip, from the `armory_items` database table.
        * @param equipDefault Equips a default variant of the armory item (if one exists) if the target slot on the character is empty. Armory item variants are defined in the `armory_item_variants` database table.
        * @param clearConflictingItem Unequips any conflicting items when this item is equipped.
        * @returns item was successfully equipped
        */
        AddArmoryItem(itemKey: string, equipDefault?: boolean, clearConflictingItem?: boolean): boolean;
        /**
        * Removes an armory item to a character.
        * @param itemKey Key for armory item to equip, from the `armory_items` database table.
        * @returns item was successfully removed
        */
        RemoveArmoryItem(itemKey: string): boolean;
        /**
         * Returns the active slot state for the specified armory item variant on the specified character. If no slot state value can be found then "INVALID" is returned.
         * @param itemVariantKey Variant of armory item to query, from the armory_item_variants database table.
         * @returns
         */
        GetArmorySlotState(itemVariantKey: string): string;
        /**
         * Equips a specific variant of an armory item on the specified character.
         * @param itemVariant Variant of armory item to equip, from the armory_item_variants database table.
         * @returns
         */
        EquipArmouryVariant(itemVariant: string): boolean;
        /**
         * (getter) Was the character in the winning alliance in a battle?
         */
        get IsRecentlyWonBattle(): boolean;
        /** (getter) Character is at sea? */
        get IsAtSea(): boolean;
        /** gets all characters in a military force IF this character is IN military force, otherwise an empty array is returned */
        get AllCharactersInMilitaryForce(): Character[];
        /**
         * (getter) gets all traits assigned to this character
         */
        get Traits(): TraitData[];
        /** Returns true if the character in military force */
        get IsInMilitaryForce(): boolean;
        /** (Getter) Forename key */
        get RawForename(): string;
        /** (Getter) Surename key */
        get RawSurename(): string;
        /** (Getter) Localised Fullname */
        get LocalisedFullName(): string;
        /** (Getter) Localised Forename */
        get LocalisedForename(): string;
        /** (Getter) Localised Surename */
        get LocalisedSurename(): string;
        /** (Getter) AgentSubtype key */
        get SubtypeKey(): string;
        /** (Getter) Faction key */
        get FactionKey(): string;
        /** (Getter) Command queue index number */
        get CqiNo(): number;
        /** (Getter) is the character in valid region? */
        get IsInRegion(): boolean;
        /**
         * Returns true if the character is a general and has an army, false otherwise.
         */
        get IsGeneralAndHasArmy(): boolean;
        /** (Getter) get character region key */
        get CurrentRegionKey(): string;
        /** (getter) has this character won in recent battle? */
        get WasWinningBefore(): boolean;
        /**
         * Check if internally referenced character is not null and it is not INullScript
         * @returns
         */
        IsValid(): boolean;
        /**
         * Check if this character has a skill
         * @param skillKey skill key from skill tables
         * @returns
         */
        HasSkill(skillKey: string): boolean;
        /**
         * Check if this character has a trait
         * @param traitKey trait key from trait tables
         * @returns
         */
        HasTrait(traitKey: string): boolean;
        /**
         * Check if this character has an ancillary
         * @param anciliaryKey ancillary key from ancillary tables
         * @returns
         */
        HasAncillary(anciliaryKey: string): boolean;
        /**
         * Gets character trait level, if it's not found it will return -1
         * @param traitKey trait key from trait tables
         * @returns
         */
        GetTraitLevel(traitKey: string): number;
        /**
         * Gets trait point (the points thing that is next to skill node in character skill tree)
         * @param traitKey trait key
         * @returns
         */
        GetTraitPoints(traitKey: string): number;
        /**
         * Give item to this character and equips it
         * @param anciliaryKey the item key (aka anciliary) from anciliary info table
         */
        GiveItem(anciliaryKey: string): void;
        /**
         * Kills this character. WARNING: this can render methods of this object to be invalid!
         * @param destroyTroop destroy the troop too? (for general/lord only)
         */
        Kill(destroyTroop?: boolean): void;
        /**
         * Rather than doing this lordA == lordB (although both instances have the same reference, the objects wrapper are still different), use this method to check if both object is equal
         * @param otherCharacter
         * @returns
         */
        IsEqual(otherCharacter: Character): boolean;
        /**
         * Rather than doing this lordA == lordB (although both instances have the same reference, the objects wrapper are still different), use this method to check if both object is equal
         * @param otherCharacter
         * @returns
         */
        HasSameInternalReferenceTo(otherCharacter: ICharacterScript): boolean;
        /** reset movement and/or action points of this character */
        ResetActionPoints(): void;
        /**
         * Grant the specified ancillary to this character
         * @param anciliaryKey Grant the specified ancillary to the specified character.
         * @param forceEquip if true the ancillary will be equipped and bypass any cooldowns or pre-conditions
         * @param supressEventFeed if true no event feed events will be generated by this action
         */
        AddAnciliary(anciliaryKey: string, forceEquip?: boolean, supressEventFeed?: boolean): void;
        /**
         * Remove the specified ancilliary from this character
         * @param anciliaryKey Ancillary key, from the ancillaries table.
         * @param putItBackToPool Removes the ancillary from the character but leaves it in the pool of available ancillaries.
         * @param supressEventFeed emoves the ancillary from the character but leaves it in the pool of available ancillaries.
         */
        RemoveAnciliary(anciliaryKey: string, putItBackToPool?: boolean, supressEventFeed?: boolean): void;
        /** returns the agentsubtype key of this object */
        toString(): string;
    }
    type LordCreationOptions = {
        characterObject?: ICharacterScript;
        cqi?: number;
        agentKey?: string;
        factionKey?: string;
        regionKey?: string;
        lordCreatedCallback?: CallbackLordCreated;
        suppressLog?: boolean;
        onFailed?: VoidCallback;
    };
    type Troop = {
        unitKey: string;
        health: number;
        experience: number;
        bannerAncillaryKey: string;
        unitCategory: string;
        unitClass: string;
    };
    /** Inherits from Character, you can extend this class if you want to have additional methods or maybe to differentiate between Lord type */
    export class Lord extends Character {
        private lordCreatedCallback;
        /**
         * @param options to create Lord from scratch, following attribute `agentKey`, `factionKey`, `regionKey` must be supplied to `options`. `lordCreatedCallback` is a callback when character spawned successfully
         * if you want to wrap existing ICharacter object, fill either `characterObject` or `cqi` into `options`
         * `onFailed` will be called if failed to spawn (only when creating/spawning Lord from agentkey)
         * @throws if characterObject is a INullScript
         * @throws if the character is not a "general type", or the cqi inputted was invalid
         */
        constructor(options?: LordCreationOptions);
        /**
         * Add troops for this Lord
         * @param mainUnitKey main unit keys from main unit table
         */
        AddTroops(mainUnitKey: string[]): void;
        /**
         * Returns troops associated with this lord
         */
        get Troops(): Troop[];
        /**
         * Remove troops from this Lord
         * @param mainUnitKey keys from main_units table
         */
        RemoveTroops(mainUnitKey: string[]): void;
        /**
         * (getter) returns true if Lord is a caster or he has a wizard hero in his army
         */
        get HasCaster(): boolean;
        /**
         * Kills this lord and his armies.
         * WARNING: Methods of this object will be invalid!
         */
        Destroy(): void;
    }
    type ChampionCreationOptions = {
        characterObject?: ICharacterScript;
        cqi?: number;
        agentKey?: string;
        factionKey?: string;
        regionKey?: string;
        agentType?: string;
        championCreatedCallback?: CallbackChampionCreated;
        suppressLog?: boolean;
        onFailed?: VoidCallback;
    };
    /** Inherits from Character, you can extend this class if you want to have additional methods or maybe to differentiate between agent type */
    export class Champion extends Character {
        private championCreatedCallback;
        /**
         * @param options to create Champion from scratch, following attribute `agentKey`, `factionKey`, `regionKey`, `agentType` must be supplied to `options`. `championCreatedCallback` is a callback when character spawned successfully
         * if you want to wrap existing ICharacter object, fill either `characterObject` or `cqi` into `options`
         * `onFailed` will be called if failed to spawn (only when creating/spawning Champion from agentkey)
         * @throws if characterObject is a INullScript
         * @throws if the cqi is invalid, if the supplied characterObject is not an agent, or agentType is not supplied when spawning an agent
         */
        constructor(options?: ChampionCreationOptions);
    }
    export {};
}
