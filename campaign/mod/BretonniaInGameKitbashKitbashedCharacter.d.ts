declare namespace BretonniaInGameKitbash {

    type CallbackBeforeEnablingArmoury = {
        (agentKey: string, character: Character): void;
    };
    type ArmoryItemToAncillary = {
        [armoryItemKey: string]: string;
    };
    type ArmoryItemToArmoryItems = {
        [armoryItemKey: string]: string[];
    };
    type Type = "head" | "cape" | "torso" | "legs" | "pauldrons" | "weapon" | "shield" | "talisman";
    /**
     * These types are used to determine which item to pick based on the power level
     */
    type ArmoryItemToValue = {
        [armoryItemKey: string]: {
            Powerlevel: number;
            Type: Type;
        };
    };
    type KitbashData = {
        defaultArmorySet: string;
        specialItems: ArmoryItemToAncillary;
        armouryItemPreferences: ArmoryItemToArmoryItems;
        bCanUseShield: boolean;
        skeletonType: string;
        callbackBeforeEnablingArmoury?: CallbackBeforeEnablingArmoury;
    };
    export class KitbashedCharacter extends Character {
        private static EnabledFactions;
        private static CharactersWithEnabledArmoury;
        private static bInited;
        private static CharacterToKitbashData;
        private static ArmoryToValue;
        static TryCast(character: Character): KitbashedCharacter | null;
        private static EnableKitbashForCharacter;
        static RegisterItemValues(armouryToValue: ArmoryItemToValue): void;
        static RegisterCallbackBeforeEnablingKitbash(agentKey: string, callback: CallbackBeforeEnablingArmoury): void;
        static Register(agentKey: string, kitbashData: KitbashData): void;
        static EnableFaction(factionKey: string): void;
        static get ArmoryList(): ArmoryItemToValue;
        static IsThisCharacterRegisteredInSaveFile(character: KitbashedCharacter): boolean;
        static get ListKitbashedCharacters(): KitbashedCharacter[];
        /**
         *  Don't expose this because we want to control the construction from CastToKitbashedCharacter
         */
        private constructor();
        IsValidKitbash(): boolean;
        HasValidKitbashConfig(): boolean;
        GetBestGearOwned(what: Type): [string, number] | null;
        private EnableKitbash;
        private EquipItemFromAvailableArmoury;
        PickTheBestArmourCombinations(): void;
        IsAncillaryArmouryItem(ancillaryKey: string): boolean;
        HasAmouryItemInCharacter(armouryItem: string): boolean;
        HasEquippedItem(itemKey: string): boolean;
        get EquippedArmoryItems(): string[];
        get AvailableArmoryItems(): string[];
        DumpInfo(): void;
        /*******************
         *
         * STATIC METHODS GO HERE:
         *
         *******************/
        static Init(): void;
        static get AvailableFactions(): string[];
        private static Load;
        private static Save;
        private static SetupEventHandlers;
        private static ProcessSpecialAncillary;
        private static ReceivedAncillaryEvent;
        static DumpManager(): void;
    }
    export {};
}
