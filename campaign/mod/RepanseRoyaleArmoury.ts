namespace RepanseRoyaleArmoury {

    function Init() {
        const api = BretonniaInGameKitbash

        core.add_listener(
            "when repanse received sword of lyonesse",
            "CharacterAncillaryGained",
            (context) => {
                if(context.ancillary == null) return false
                if(context.character == null) return false
                const character = context.character()
                const ancillary = context.ancillary()

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