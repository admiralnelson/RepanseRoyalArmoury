namespace RepanseRoyaleArmoury {
    const api = BretonniaInGameKitbash

    function IsRepanseAIControlled() : boolean {
        const repanseFaction = api.GetFactionByKey("wh2_dlc14_brt_chevaliers_de_lyonesse")
        const isAiControlled = repanseFaction?.IsHuman

        return !isAiControlled
    }

    function GiveRepanseHerSpecialItemsForAI() {
        if(!IsRepanseAIControlled()) return

        const repanseFaction = api.GetFactionByKey("wh2_dlc14_brt_chevaliers_de_lyonesse")
        const factionLeader = repanseFaction?.FactionLeader
        if(factionLeader == null) return

        const kitbashedRepanse = api.KitbashedCharacter.TryCast(factionLeader)
        if(kitbashedRepanse == null) return

        const availableArmouryItems = kitbashedRepanse.AvailableArmoryItems

        const hasTheTorsoArmour = availableArmouryItems.includes("kitbasher_repanse_blessed_armor_of_the_lady")
        if(hasTheTorsoArmour) return

        //step 1. give her torso armour
        setTimeout(() => {
            factionLeader.AddArmoryItem("kitbasher_repanse_blessed_armor_of_the_lady", true, true)
        }, 100)

        //step 2. give her leg armour
        setTimeout(() => {
            factionLeader.AddArmoryItem("kitbasher_repanse_greaves_of_the_lady", true, true)
        }, 150)

        //step 3. give her pauldron armour
        setTimeout(() => {
            factionLeader.AddArmoryItem("kitbasher_repanse_pauldrons_of_the_lady", true, true)
        }, 200)
    }

    function Init() {

        GiveRepanseHerSpecialItemsForAI()

        core.add_listener(
            "when repanse received sword of lyonesse",
            "CharacterAncillaryGained",
            (context) => {
                if(context.ancillary == null) return false
                if(context.character == null) return false
                const character = context.character()
                const ancillary = context.ancillary()
                
                if(IsRepanseAIControlled()) return false

                const isSwordOfLyonese = ancillary === "wh2_dlc14_anc_weapon_sword_of_lyonesse"
                const lord  = api.WrapICharacterObjectToCharacter(character)

                const isRepanse = lord.SubtypeKey == "wh2_dlc14_brt_repanse"

                return isSwordOfLyonese && isRepanse
            },
            (context) => {
                if(context.character == null) return

                const character = context.character()

                console.log("Giving Repanse the Armoury")

                const lord  = api.WrapICharacterObjectToCharacter(character)
                setTimeout(() => {
                    lord.AddAnciliary("admiralnelson_blessed_armor_of_the_lady", true, false)
                }, 200)

                setTimeout(() => {
                    lord.AddAnciliary("admiralnelson_pauldrons_of_the_lady", true, false)
                }, 300)

                setTimeout(() => {
                    lord.AddAnciliary("admiralnelson_greaves_of_the_lady", true, false)
                }, 400)
            },
            true
        )
    }
    
    OnCampaignStart( () => Init() )

}