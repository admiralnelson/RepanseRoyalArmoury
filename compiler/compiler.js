const { spawnSync, execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

if (process.argv.includes('--clean')) {
    ClearDirectory()
    return
} 

let PROJECT_NAME = ""
let RPFM_EXE = ""
let SCHEMA_PATH = ""
let CLEAN_AFTER_COMPILE = false
let FACTION = ""
let PACK_FILE_TO_MERGE = ""


const args = process.argv
for(let i = 0; i < args.length; i++) {
    if(args[i] === '--project') {
        PROJECT_NAME = args[i + 1];
    }

    if(args[i] === '--rpfm-path') {
        RPFM_EXE = args[i + 1];
    }

    if(args[i] === '--schema-path') {
        SCHEMA_PATH = args[i + 1];
    }

    if(args[i] === '--faction') {
        FACTION = args[i + 1];
    }

    if(args[i] === "--clean-after-compile") {
        CLEAN_AFTER_COMPILE = true
    }    

    if(args[i] === "--pack-file-to-merge") {
        PACK_FILE_TO_MERGE = args[i + 1]
    }    
}

if(PROJECT_NAME == "") {
    console.error("--project is not defined")
    return 1
}

if(RPFM_EXE == "") {
    console.error("--rpfm-path which should point to rpfm_cli.exe is not defined")
    return 1
}

if(SCHEMA_PATH == "") {
    console.error("--schema-path which should point to schema_wh3.ron is not defined")
    return 1
}

if(FACTION == "") {
    console.error("--faction should be valid faction key like wh_main_brt_bretonnia")
    return 1
}




/**
 * Reads *.json and parses it then concatenate it as big array
 * @returns {Array<object>}
 */
function ReadArmouryDefinitions() {
    const directoryPath = path.join(__dirname, '../armoury_definitions')
    let result = []

    const files = fs.readdirSync(directoryPath)

    const jsonFiles = files.filter(file => path.extname(file).toLowerCase() === '.json')

    for (let file of jsonFiles) {
        const filePath = path.join(directoryPath, file)
        const data = fs.readFileSync(filePath)
        
        const objects = JSON.parse(data)
        objects.forEach(object => {
            const keys = [
                'ItemName', 
                'LocalisedName', 
                'Description', 
                'Type', 
                'IsItemDefinedFromAncillary', 
                'AssociatedWithArmouryItemSet', 
                'Skeleton', 
                'ItemCategory', 
                'UiIcon', 
                'Thumbnail', 
                'UnitCardThumbnail', 
                "VariantMeshScale", 
                "VariantMeshScale", 
                "VariantMeshMountScale", 
                "AssociatedAncillaryKey",
                "BattleAnimation",
                "CampaignAnimation",
                "OnlyCompatibleWithItem",
                "AudioType",
                "SubtypeKeys",
                "VariantMeshDefinitionShouldCreate",
                "PreferencedItems",
            ]
            keys.forEach(key => {
                if (!(key in object)) {
                    throw new Error(`Missing key ${key} in object ${JSON.stringify(object)}`)
                }
            })
        })

        result = result.concat(objects)
    }

    return result
}

/**
 * Reads *.json and parse it then concat as big array
 * @returns {Array<object>}
 */
function ReadArmouryData() {
    const directoryPath = path.join(__dirname, '../armoury_data')
    let result = []

    const files = fs.readdirSync(directoryPath)

    const jsonFiles = files.filter(file => path.extname(file).toLowerCase() === '.json')

    for (let file of jsonFiles) {
        const filePath = path.join(directoryPath, file)
        const data = fs.readFileSync(filePath)
        
        const objects = JSON.parse(data)
        objects.forEach(object => {
            const keys = [
                'SubtypeKey', 
                'Skeleton', 
                'DefaultArmoryItemSet', 
                "bCanUseShield"
            ]
            keys.forEach(key => {
                if (!(key in object)) {
                    throw new Error(`Missing key ${key} in object ${JSON.stringify(object)}`)
                }
            })
        })

        result = result.concat(objects)
    }

    return result

}

/**
 * Reads *.json and parse it then concat as big array
 * @returns {Array<object>}
 */
function ReadAncillaryData() {
    const directoryPath = path.join(__dirname, '../armoury_to_ancillary')
    let result = []

    const files = fs.readdirSync(directoryPath)

    const jsonFiles = files.filter(file => path.extname(file).toLowerCase() === '.json')

    for (let file of jsonFiles) {
        const filePath = path.join(directoryPath, file)
        const data = fs.readFileSync(filePath)
        
        const objects = JSON.parse(data)
        objects.forEach(object => {
            const keys = [
                'AncillaryKey', 
                'PowerLevel', 
                'Effects', 
            ]
            keys.forEach(key => {
                if (!(key in object)) {
                    throw new Error(`Missing key ${key} in object ${JSON.stringify(object)}`)
                }
            })

            object.Effects.forEach(effects => {
                const keys = [
                    'EffectKey', 
                    'Scope', 
                    'Value', 
                ]

                keys.forEach(key => {
                    if (!(key in effects)) {
                        throw new Error(`Missing key ${key} in object ${JSON.stringify(object)}`)
                    }
                })
            })
        })

        result = result.concat(objects)
    }

    return result
}

const ArmouryDefs = ReadArmouryDefinitions()
const ArmouryData = ReadArmouryData()
const AncillaryData = ReadAncillaryData()

/**
 * Validates before compiling
 * Like checking if the same subtypekey has been redefined again
 */

/**
 * Runs check against ArmouryData
 * If found another same SubtypeKey, it throws an exception
 */
function CheckForDuplicateSubtypeKey() {
    const seen = new Set();

    for (const object of ArmouryData) {
        if (seen.has(object.SubtypeKey)) {
            throw new Error(`Duplicate SubtypeKey found: ${object.SubtypeKey}`);
        }
        seen.add(object.SubtypeKey);
    }
}

function CheckForInvalidTypes() {
    let errored = false
    for (const def of ArmouryDefs) {
        const types = ["cape", "talisman", "head", "torso", "legs", "shield", "1handed", "2handed", "pauldrons"]
        if(!types.includes(def.Type)) {
            console.log(`Invalid type: ${def.Type} in item ${def.ItemName}`)
            errored = true
        }
        
    }

    if(errored) throw "found invalid types"
}

/**
 * Runs check against ArmouryDefs
 * If found another same ItemName, it throws an exception
 */
function CheckForDuplicateItemName() {
    const seen = new Set();

    for (const object of ArmouryDefs) {
        if (seen.has(object.ItemName)) {
            throw new Error(`Duplicate ItemName found: ${object.ItemName}`);
        }
        seen.add(object.ItemName);
    }
}

/**
 * Runs check against ArmouryDefs
 * If armoury def is a type of head, the name should contain "head" in it
 */
function CheckForDuplicateItemName() {

    for (const object of ArmouryDefs) {
        if(object.Type != "head") continue

        if(!object.ItemName.includes("head")) {
            throw "this object " + object.ItemName + " is a type of head but does not contain 'head' in it, this will result in invisible thumbnail/card"
        }
    }
}

/**
 * Ensure that thumbnails defined in the ArmouryDef are valid
 */

function CheckForThumbnailPath() {
    let errored = false
    for (const def of ArmouryDefs) {
        if(def.Type != "head") continue

        const thumbnailPath = path.isAbsolute(def.Thumbnail) ? def.Thumbnail : path.join(__dirname, '..', def.Thumbnail)
        const unitCardThumbnailPath = path.isAbsolute(def.UnitCardThumbnail) ? def.UnitCardThumbnail : path.join(__dirname, '..', def.UnitCardThumbnail)

        if (!fs.existsSync(thumbnailPath) || path.extname(thumbnailPath) !== '.png') {
            console.log(`Invalid Thumbnail: ${thumbnailPath}`)
            errored = true
            continue
        }
        if (!fs.existsSync(unitCardThumbnailPath) || path.extname(unitCardThumbnailPath) !== '.png') {
            console.log(`Invalid Unit Card Thumbnail: ${unitCardThumbnailPath}`)
            errored = true
            continue
        }
        const filename = path.basename(unitCardThumbnailPath, ".png")
        if(filename != def.ItemName) {
            console.log(`File name does not match with ItemName: ${unitCardThumbnailPath}, ItemName is ${def.ItemName}`)
            errored = true
        }
        
        if(def.ItemName.length > 40) {
            console.log(`Head ItemName is too long (which is tied to your porthole/unitcard pngs): ${unitCardThumbnailPath}, ItemName is ${def.ItemName} max is 40, yours is ${def.ItemName.length}`)
            errored = true
        }
    }

    if(errored) throw "found invalid thumbnail"
}

/**
 * Runs check against AncillaryData
 * If found another same AncillaryKey, it throws an exception
 */
function CheckForDuplicateSubtypeKey() {
    const seen = new Set();

    for (const object of AncillaryData) {
        if (seen.has(object.AncillaryKey)) {
            throw new Error(`Duplicate AncillaryKey found: ${object.AncillaryKey}`);
        }
        seen.add(object.AncillaryKey);
    }
}

/**
 * Get ancillary data by its key
 * @param {string} key 
 * @returns {object}
 */
function GetAncillaryByKey(key) {
    const ret = AncillaryData.filter( (item) =>  item.AncillaryKey == key)
    if(ret.length == 1) return ret[0]

    return null
}

/**
 * Throws a warning if armoury item not defined in armoury_to_ancillary
 */
function CheckForAncillaryMapping() {
    for (const def of ArmouryDefs) {
        if(def.AssociatedAncillaryKey == null) continue

        if(!GetAncillaryByKey(def.AssociatedAncillaryKey)) {
            console.warn(`WARNING: armoury item ${def.ItemName} referenced undefined ancillary ${def.AssociatedAncillaryKey}`)
        }

    }

}

/**
 * Check if Icon points to valid pngs
 */

function CheckForIconsPath() {
    let errored = false
    for (const def of ArmouryDefs) {

        if(!def.UiIcon) {
            console.log(`No icon: ${def.ItemName}`)
            errored = true
            continue
        }

        const icon = path.isAbsolute(def.UiIcon) ? def.UiIcon : path.join(__dirname, '..', def.UiIcon)

        if (!fs.existsSync(icon) || path.extname(icon) !== '.png') {
            console.log(`Invalid icon: ${icon}`)
            errored = true
            continue
        }

        const filename = path.basename(icon, ".png")
        if(filename != def.ItemName) {
            console.log(`File name does not match with ItemName: ${icon}, ItemName is ${def.ItemName}`)
            errored = true
        }

    }

    if(errored) throw "found invalid icons"
}

/**
 * Ensure that default sets have cape, talisman, head, torso, legs, shield, 1handed, (or 2handed), (or pauldrons)
 */
function CheckForDefaultSets() {
    let transformedData = {};

    for (let item of ArmouryDefs) {
        let armourySet = item["AssociatedWithArmouryItemSet"]

        if(!armourySet) continue
        
        if (!(armourySet in transformedData)) {
            transformedData[armourySet] = {}
        }
        
        transformedData[armourySet][item["Type"]] = item
    }

    let errored = false
    for (let armourySet in transformedData) {
        if (("1handed" in transformedData[armourySet] || "shield" in transformedData[armourySet]) && "2handed" in transformedData[armourySet]) {
            console.warn(`Conflict in ${armourySet}: both 1handed/shield and 2handed types are present.`)
            errored = true
        }

        if (!("head" in transformedData[armourySet] && 
              "torso" in transformedData[armourySet] && 
              "legs" in transformedData[armourySet] )) {
            console.warn(`In ${armourySet}: both head, torso, legs must be present.`)
            errored = true
        }
    }

    if(errored) throw "found conflicting/problematic default armour sets"

}

/**
 * variant mesh check
 */

function CheckForVariantMesh() {
    let errored = false
    for (let item of ArmouryDefs) {

        if (item["Type"] !== "talisman" && 
            item["VariantMesh"] == null) {
            console.warn(`Item ${item["ItemName"]} of type ${item["Type"]} has null VariantMesh.`);
            errored = true
        }
    }

    if(errored) throw "found null VariantMeshes"
}

function CheckPreferencedItemsPointsToValidItem() {
    const itemNames = ArmouryDefs.map(item => item.ItemName)
    const itemNamesToSkeleton =  ArmouryDefs.reduce((obj, item) => {
        obj[item.ItemName] = item.Skeleton;
        return obj;
    }, {});

    for (const item of ArmouryDefs) {
        if(item.PreferencedItems == null || item.PreferencedItems.length == 0) continue
        if(!item.PreferencedItems.every(elem => itemNames.includes(elem))) {
            throw "ItemName " + item.ItemName + " has invalid undefined item defined in  PreferencedItems: " + JSON.stringify(item.PreferencedItems)
        }

        for (const item2 of item.PreferencedItems) {
            if(!itemNamesToSkeleton[item2]) 
                throw "ItemName " + item2 + " has invalid undefined item defined in  PreferencedItems: " + JSON.stringify(item.PreferencedItems)

            if(itemNamesToSkeleton[item2] != item.Skeleton) 
                throw "ItemName " + item2 + " has invalid mismatch skeleton " + item2 + " is " + itemNamesToSkeleton[item2] + " but parent item is " + item.Skeleton + "\n" + JSON.stringify(item)
        }
    }

}

function CheckIfSubtypeIsValidInArmouryItem() {

    const subtypes = Array.from(new Set(ArmouryData.map(item => item.SubtypeKey)))

    for (const item of ArmouryDefs) {
        if(!Array.isArray(item.SubtypeKeys)) {
            throw "ItemName " + item.ItemName + " has invalid Subtypekeys. is not an array but " +  item.SubtypeKeys
        }
        
        if(!item.SubtypeKeys.every(elem => subtypes.includes(elem))) {
            throw "ItemName " + item.ItemName + " has invalid undefined subtype defined in  Subtypekeys: " + JSON.stringify(item.SubtypeKeys) + " possible subtypes are " + JSON.stringify(subtypes)
        }
    }
}

console.log("Validating data")
CheckForDuplicateItemName()
CheckForDuplicateSubtypeKey()
CheckForDuplicateItemName()
CheckForInvalidTypes()
CheckForAncillaryMapping()
CheckForIconsPath()
CheckForThumbnailPath()
CheckForDefaultSets()
CheckForVariantMesh()
CheckPreferencedItemsPointsToValidItem()
CheckIfSubtypeIsValidInArmouryItem()
console.log("Data validated")


/**
 * Compiling the tables....
 */

/**
 * Generate agent_subtypes_to_armory_item_sets_tables
 * @returns {Array<object>}
 */
function GenerateArmoryAgentSubtypesToArmoryItemSets() {
    const output = []
    for (const armoury of ArmouryData) {
        output.push({
            armory_item_set: armoury.DefaultArmoryItemSet,
            agent_subtype: armoury.SubtypeKey
        })
    }

    return output
}

/**
 * Generate armory_item_set_items_tables
 * @returns {Array<object>}
 */
function GenerateArmoryItemSetItems() {
    const output = []
    for (const armoury of ArmouryData) {
        for (const armourDef of ArmouryDefs) {
            if(armourDef.AssociatedWithArmouryItemSet != null && 
               armourDef.AssociatedWithArmouryItemSet != armoury.DefaultArmoryItemSet) continue
            else {
                if(armourDef.Skeleton != armoury.Skeleton) continue
            }

            let armouryAssociation = armoury.DefaultArmoryItemSet
            if(!armourDef.AssociatedWithArmouryItemSet) continue

            output.push({
                armory_item: armourDef.ItemName,
                armory_item_set: armouryAssociation
            })
        }
    }

    for (const armourDef of ArmouryDefs) {
        if(armourDef.AssociatedWithArmouryItemSet) continue

        armouryAssociation = "const_kitbasher_unassigned_armoury_item"

        output.push({
            armory_item: armourDef.ItemName,
            armory_item_set: armouryAssociation
        })
    }

    return output
}

/**
 * Generate armory_item_set_items_tables but dummy (use case for no pauldrons)
 * @returns {Array<object>}
 */
function GenerateDummyArmoryItemSetItems() {
    const output = []
    for (const armoury of ArmouryData) {
        output.push({
            armory_item: `const_kitbasher_dummy_arm_left__${armoury.Skeleton}`,
            armory_item_set: armoury.DefaultArmoryItemSet
        })
        output.push({
            armory_item: `const_kitbasher_dummy_arm_right__${armoury.Skeleton}`,
            armory_item_set: armoury.DefaultArmoryItemSet
        })
        output.push({
            armory_item: `const_kitbasher_dummy_wings__${armoury.Skeleton}`,
            armory_item_set: armoury.DefaultArmoryItemSet
        })
        output.push({
            armory_item: `const_kitbasher_dummy_tail__${armoury.Skeleton}`,
            armory_item_set: armoury.DefaultArmoryItemSet
        })

        ////
        
    }

    const skeletons = Array.from(new Set(ArmouryData.map(item => item.Skeleton)))

    for (const skeleton of skeletons) {
        const undefinedItem = "const_kitbasher_unassigned_armoury_item"
        output.push({
            armory_item: `const_kitbasher_dummy_arm_left__${skeleton}`,
            armory_item_set: undefinedItem
        })
        output.push({
            armory_item: `const_kitbasher_dummy_arm_right__${skeleton}`,
            armory_item_set: undefinedItem
        })
        output.push({
            armory_item: `const_kitbasher_dummy_wings__${skeleton}`,
            armory_item_set: undefinedItem
        })
        output.push({
            armory_item: `const_kitbasher_dummy_tail__${skeleton}`,
            armory_item_set: undefinedItem
        })
    }

    return output
}

/**
 * Generate armory_item_sets_tables
 * @returns {Array<object>}
 */
function GenerateArmoryItemSets() {
    const seen = new Set();

    for (const object of ArmouryData) {
        seen.add(object.DefaultArmoryItemSet);
    }

    const defaults = Array.from(seen)
    const output = []

    for (const key of defaults) {
        output.push({
            key: key
        })
    }

    return output
}

/**
 * Generate armory_item_slot_blacklists_tables
 * @returns {Array<object>}
 */
function GenerateArmoryItemSlotBlacklists() {
    const output = []
    for (const def of ArmouryDefs) {
        if(def.Type == "2handed") {
            output.push({
                armory_item: def.ItemName,
                slot: "weapon_2"
            })
        } 
        if(def.Type == "1handed") {
            output.push({
                armory_item: def.ItemName,
                slot: "weapon_1"
            })
        }
        if(def.Type == "shield") {
            output.push({
                armory_item: def.ItemName,
                slot: "weapon_1"
            })
        }
    }

    return output
}

/**
 * Generate armory_item_to_category_sets_tables
 * @returns {Array<object>}
 */
function GenerateArmoryItemToCategorySets() {
    const output = []
    for (const def of ArmouryDefs) {
        let categorySet = ""
        switch (def.Type) {
            case "cape":
            case "talisman":
            case "head":
            case "torso":
            case "cape":
            case "legs":
            case "pauldrons":
                categorySet = "generic"
                break
            case "shield":
                categorySet = "weapon_shield"
                break
            case "1handed":
                categorySet = "weapon_1_handed"
                break
            case "2handed":
                categorySet = "weapon_2_handed"
                break        
            default:
                break;
        }

        output.push({
            armory_item: def.ItemName,
            category_set: categorySet
        })
    }

    return output
}

/**
 * Generate armory_item_to_category_sets_tables but dummy (use case for no pauldrons)
 * @returns {Array<object>}
 */
function GenerateDummyArmoryItemToCategorySets() {
    const seen = new Set();

    for (const object of ArmouryData) {
        seen.add(object.Skeleton);
    }

    const Skeletons = Array.from(seen)
    
    const output = []
    for (const skeleton of Skeletons) {
        output.push({
            armory_item: `const_kitbasher_dummy_arm_left__${skeleton}`,
            category_set: "generic"
        })
        output.push({
            armory_item: `const_kitbasher_dummy_arm_right__${skeleton}`,
            category_set: "generic"
        })
        output.push({
            armory_item: `const_kitbasher_dummy_wings__${skeleton}`,
            category_set: "generic"
        })
        output.push({
            armory_item: `const_kitbasher_dummy_tail__${skeleton}`,
            category_set: "generic"
        })
    }

    return output
}

function GenerateArmoryItemUiInfos() {
    const output = []
    for (const def of ArmouryDefs) {
        let type = ""
        switch (def.ItemCategory) {
            case "unique": //means the same
                type = "const_kitbasher_20_legendary" //type = "const_kitbasher_10_unique"
                break
            case "legendary":
                type = "const_kitbasher_20_legendary"
                break
            case "rare":
                type = "const_kitbasher_30_rare"
                break
            case "uncommon":
                type = "const_kitbasher_40_uncommon"
                break
            case "common":
                type = "const_kitbasher_50_common"
                break
            default:
                break;
        }

        output.push({
            armory_item: def.ItemName,
            type: type
        })
    }

    return output
}

function GenerateDummyArmoryItemUiInfos() {
    const seen = new Set();

    for (const object of ArmouryData) {
        seen.add(object.Skeleton);
    }

    const Skeletons = Array.from(seen)
    
    const output = []
    for (const skeleton of Skeletons) {
        output.push({
            armory_item: `const_kitbasher_dummy_arm_left__${skeleton}`,
            type: "const_kitbasher_50_common"
        })
        output.push({
            armory_item: `const_kitbasher_dummy_arm_right__${skeleton}`,
            type: "const_kitbasher_50_common"
        })
        output.push({
            armory_item: `const_kitbasher_dummy_wings__${skeleton}`,
            type: "const_kitbasher_50_common"
        })
        output.push({
            armory_item: `const_kitbasher_dummy_tail__${skeleton}`,
            type: "const_kitbasher_50_common"
        })
    }

    return output
}

function GenerateArmoryItemVariantUiInfos() {
    const output = []

    for (const def of ArmouryDefs) {
        output.push({
            key: def.ItemName
        })
    }

    return output
}

function GenerateDummyArmoryItemVariantUiInfos() {
    const seen = new Set();

    for (const object of ArmouryData) {
        seen.add(object.Skeleton);
    }

    const Skeletons = Array.from(seen)
    
    const output = []
    for (const skeleton of Skeletons) {
        output.push({
            key: `const_kitbasher_dummy_arm_left__${skeleton}`,
        })
        output.push({
            key: `const_kitbasher_dummy_arm_right__${skeleton}`,
        })
        output.push({
            key: `const_kitbasher_dummy_wings__${skeleton}`,
        })
        output.push({
            key: `const_kitbasher_dummy_tail__${skeleton}`,
        })
    }

    return output
}

function GenerateArmoryItemVariants() {
    const output = []

    for (const def of ArmouryDefs) {
        switch (def.Type) {
            case "cape":
            case "talisman":
            case "head":
            case "torso":
            case "cape":
            case "legs":
            case "pauldrons":
            case "shield":
                output.push({
                    armory_item: def.ItemName,
                    variant: def.ItemName,
                    battle_animation: "",
                    campaign_animation: "",
                    use_as_default: true,
                    ui_info: def.ItemName
                })
                break
            case "1handed":
            case "2handed":
                output.push({
                    armory_item: def.ItemName,
                    variant: def.ItemName,
                    battle_animation: def.BattleAnimation,
                    campaign_animation: def.CampaignAnimation,
                    use_as_default: true,
                    ui_info: def.ItemName
                })
                break
            default:
                break;
        }

    }

    return output
}

function GenerateDummyArmoryItemVariants() {
    const seen = new Set();

    for (const object of ArmouryData) {
        seen.add(object.Skeleton);
    }

    const Skeletons = Array.from(seen)
    
    const output = []
    for (const skeleton of Skeletons) {
        output.push({
            armory_item: `const_kitbasher_dummy_arm_left__${skeleton}`,
            variant: `const_kitbasher_dummy_arm_left__${skeleton}`,
            battle_animation: "",
            campaign_animation: "",
            use_as_default: true,
            ui_info: `const_kitbasher_dummy_arm_left__${skeleton}`
        })
        output.push({
            armory_item: `const_kitbasher_dummy_arm_right__${skeleton}`,
            variant: `const_kitbasher_dummy_arm_right__${skeleton}`,
            battle_animation: "",
            campaign_animation: "",
            use_as_default: true,
            ui_info: `const_kitbasher_dummy_arm_right__${skeleton}`,
        })
        output.push({
            armory_item: `const_kitbasher_dummy_wings__${skeleton}`,
            variant: `const_kitbasher_dummy_wings__${skeleton}`,
            battle_animation: "",
            campaign_animation: "",
            use_as_default: true,
            ui_info: `const_kitbasher_dummy_wings__${skeleton}`,
        })
        output.push({
            armory_item:  `const_kitbasher_dummy_tail__${skeleton}`,
            variant: `const_kitbasher_dummy_tail__${skeleton}`,
            battle_animation: "",
            campaign_animation: "",
            use_as_default: true,
            ui_info: `const_kitbasher_dummy_tail__${skeleton}`,
        })
    }

    return output
}

function GenerateArmoryItems() {
    const output = []

    for (const def of ArmouryDefs) {
        let slot = ""
        switch (def.Type) {
            case "cape":
                slot = "left_arm"
                break
            case "talisman":
                slot = "tail"
                break
            case "head":
                slot = "head"
                break
            case "torso":
                slot = "torso"
                break
            case "legs":
                slot = "legs"
                break
            case "pauldrons":
                slot = "right_arm"
                break
            case "shield":
                slot = "shield"
                break
            case "1handed":
                slot = "weapon_2"
                break
            case "2handed":
                slot = "weapon_1"
                break
            default:
                break;
        }

        output.push({
            key: def.ItemName,
            slot_type: slot
        })
    }

    return output
}


function GenerateDummyArmoryItems() {
    const seen = new Set();

    for (const object of ArmouryData) {
        seen.add(object.Skeleton);
    }

    const Skeletons = Array.from(seen)
    
    const output = []
    for (const skeleton of Skeletons) {
        output.push({
            key: `const_kitbasher_dummy_arm_left__${skeleton}`,
            slot_type: "left_arm",
        })
        output.push({
            key: `const_kitbasher_dummy_arm_right__${skeleton}`,
            slot_type: "right_arm",
        })
        output.push({
            key:  `const_kitbasher_dummy_tail__${skeleton}`,
            slot_type: "tail",
        })
        output.push({
            key: `const_kitbasher_dummy_wings__${skeleton}`,
            slot_type: "wings",
        })
    }

    return output
}

function GenerateBattleSkeletonParts() {
    const output = []

    for (const def of ArmouryDefs) {

        let skeleton =  def.Skeleton || "humanoid01"

        output.push({
            variant_name: def.ItemName,
            skeleton: skeleton
        })
    }

    return output
}

function GenerateDummyBattleSkeletonParts() {
    const seen = new Set();

    for (const object of ArmouryData) {
        seen.add(object.Skeleton);
    }

    const Skeletons = Array.from(seen)
    
    const output = []
    for (const skeleton of Skeletons) {
        output.push({
            variant_name: `const_kitbasher_dummy_arm_left__${skeleton}`,
            skeleton: skeleton,
        })
        output.push({
            variant_name: `const_kitbasher_dummy_arm_right__${skeleton}`,
            skeleton: skeleton,
        })
        output.push({
            variant_name:  `const_kitbasher_dummy_tail__${skeleton}`,
            skeleton: skeleton,
        })
        output.push({
            variant_name: `const_kitbasher_dummy_wings__${skeleton}`,
            skeleton: skeleton,
        })
    }

    return output
}

function GenerateVariants() {
    const output = []

    for (const def of ArmouryDefs) {
        let variantMeshPath = def.VariantMeshMountScale || ""

        output.push({
            variant_name: def.ItemName,
            tech_folder: "",
            variant_filename: def.VariantMesh,
            mount_scale: variantMeshPath,
            scale: def.VariantMeshScale,
            scale_variation: 0,
            VariantMeshDefinitionShouldCreate: def.VariantMeshDefinitionShouldCreate
        })
    }

    return output
}

function GenerateDummyVariants() {
    const seen = new Set();

    for (const object of ArmouryData) {
        seen.add(object.Skeleton);
    }

    const Skeletons = Array.from(seen)
    
    const output = []
    for (const skeleton of Skeletons) {
        output.push({
            variant_name: `const_kitbasher_dummy_arm_left__${skeleton}`,
            tech_folder: "",
            variant_filename: "",
            mount_scale: 1,
            scale: 1,
            scale_variation: 0
        })
        output.push({
            variant_name: `const_kitbasher_dummy_arm_right__${skeleton}`,
            tech_folder: "",
            variant_filename: "",
            mount_scale: 1,
            scale: 1,
            scale_variation: 0
        })
        output.push({
            variant_name:  `const_kitbasher_dummy_tail__${skeleton}`,
            tech_folder: "",
            variant_filename: "",
            mount_scale: 1,
            scale: 1,
            scale_variation: 0
        })
        output.push({
            variant_name: `const_kitbasher_dummy_wings__${skeleton}`,
            tech_folder: "",
            variant_filename: "",
            mount_scale: 1,
            scale: 1,
            scale_variation: 0
        })
    }

    return output
}

// console.log(GenerateArmoryAgentSubtypesToArmoryItemSets())
// console.log(GenerateArmoryItemSetItems())
// console.log(GenerateDummyArmoryItemSetItems())
// console.log(GenerateArmoryItemSlotBlacklists())
// console.log(GenerateArmoryItemSets())
// console.log(GenerateArmoryItemToCategorySets())
// console.log(GenerateDummyArmoryItemSlotBlacklists())
// console.log(GenerateArmoryItemUiInfos())
// console.log(GenerateDummyArmoryItemUiInfos())
// console.log(GenerateArmoryItemVariantUiInfos())
// console.log(GenerateDummyArmoryItemVariantUiInfos())
// console.log(GenerateArmoryItemVariants())
// console.log(GenerateDummyArmoryItemVariants())
// console.log(GenerateArmoryItems())
// console.log(GenerateDummyArmoryItems())
// console.log(GenerateBattleSkeletonParts())
// console.log(GenerateDummyBattleSkeletonParts())
// console.log(GenerateVariants())
// console.log(GenerateDummyVariants())

/**
 * TODO: Generate variantmesh also!
 */

function ClearDirectory() {
    
    let dir = path.join('build', 'intermediate')
    let dir2 = path.join("script", 'build', 'intermediate')

    let command = ""
    let command2 = ""
    if(dir == "") return

    if (process.platform === 'win32') {
        command = `rmdir /S /Q ${dir}`
        command2 = `rmdir /S /Q ${dir2}`
    } else {
        command = `rm -rf ${dir}`
        command2 = `rm -rf  ${dir2}`
    }

    try {
        execSync(command)
        execSync(command2)
    } catch (error) {
        
    }
}

function GenerateVariantMesh() {
    
    // Define the mapping for the part names and attach points
    const partMapping = {
        "cape": "left_arm",
        "talisman": "tail",
        "pauldrons": "right_arm",
        "1handed": "weapon_2",
        "2handed": "weapon_1"
    }
    const attachPointMapping = {
        "1handed": 'attach_point="be_prop_1"',
        "2handed": 'attach_point="be_prop_0"',
        "shield": 'attach_point="be_prop_2"'
    }

    let dir = path.join('build', 'intermediate', "variantmeshes", "variantmeshdefinitions", "autogenerated")
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true })
    }

    let count = 0;
    const spinner = ['|', '/', '-', '\\']

    for (let item of ArmouryDefs) {
        if(!item.VariantMeshDefinitionShouldCreate) continue

        let part = partMapping[item["Type"]] || item["Type"]
        let attachPoint = attachPointMapping[item["Type"]] || ""

        let xml = `<VARIANT_MESH>\n`
        xml += `    <SLOT name="${part}" ${attachPoint}>\n`
        xml += `        <VARIANT_MESH model="${item["VariantMesh"] ?? ""}">\n`
        xml += `            <META_DATA>${item["AudioType"] ?? ""}</META_DATA>\n`
        xml += `        </VARIANT_MESH>\n`
        xml += `    </SLOT>\n`
        xml += `</VARIANT_MESH>`

        fs.writeFileSync(path.join('build', 'intermediate', "variantmeshes", "variantmeshdefinitions", "autogenerated" , `${item["ItemName"]}.variantmeshdefinition`), xml)
        
        count++
        process.stdout.write(`\r Processing ${spinner[count % spinner.length]} ${count} / ${ArmouryDefs.length}`)
    }

    process.stdout.write('\n')
}

console.log("Clean directory")
ClearDirectory()

console.log("Generating variant mesh")
GenerateVariantMesh()

function GenerateCsv_agent_subtypes_to_armory_item_sets_tables(data, projectName) {

    const randomNumbering = Math.floor(Math.random() * 1000000)
    const header = `armory_item_set	agent_subtype\n` +
    `#agent_subtypes_to_armory_item_sets_tables;0;db/agent_subtypes_to_armory_item_sets_tables/ZZ_${projectName}_${randomNumbering}_armory_data	\n`

    let out = ""
    for (const item of data) {
        out += `${item.armory_item_set}	${item.agent_subtype}\n`
    }

    const result = (header + out).trim()
    let dir = path.join('build', 'intermediate', "db", "agent_subtypes_to_armory_item_sets_tables")
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true })
    }
    const tableName = `ZZ_${projectName}_${randomNumbering}_armory_data.tsv`
    const tsv = header + out
    fs.writeFileSync(path.join(dir, tableName), tsv)
}

function GenerateCsv_armory_item_set_items_tables(data, projectName) {

    const randomNumbering = Math.floor(Math.random() * 1000000)
    const header = `armory_item	armory_item_set\n` +
    `#armory_item_set_items_tables;0;db/armory_item_set_items_tables/ZZ_${projectName}_${randomNumbering}_armory_data	\n`

    let out = ""
    for (const item of data) {
        out += `${item.armory_item}	${item.armory_item_set}\n`
    }

    const result = (header + out).trim()
    let dir = path.join('build', 'intermediate', "db", "armory_item_set_items_tables")
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true })
    }
    const tableName = `ZZ_${projectName}_${randomNumbering}_armory_data.tsv`
    const tsv = header + out
    fs.writeFileSync(path.join(dir, tableName), tsv)
}

function GenerateCsv_armory_item_sets_tables(data, projectName) {

    const randomNumbering = Math.floor(Math.random() * 1000000)
    const header = `key\n` +
    `#armory_item_sets_tables;0;db/armory_item_sets_tables/ZZ_${projectName}_${randomNumbering}_armory_data	\n`

    let out = ""
    for (const item of data) {
        out += `${item.key}\n`
    }

    const result = (header + out).trim()
    let dir = path.join('build', 'intermediate', "db", "armory_item_sets_tables")
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true })
    }
    const tableName = `ZZ_${projectName}_${randomNumbering}_armory_data.tsv`
    const tsv = header + out
    fs.writeFileSync(path.join(dir, tableName), tsv)
}

function GenerateCsv_armory_item_slot_blacklists_tables(data, projectName) {

    const randomNumbering = Math.floor(Math.random() * 1000000)
    const header = `armory_item	slot\n` +
    `#armory_item_slot_blacklists_tables;0;db/armory_item_slot_blacklists_tables/ZZ_${projectName}_${randomNumbering}_armory_data	\n`

    let out = ""
    for (const item of data) {
        out += `${item.armory_item}	${item.slot}\n`
    }

    const result = (header + out).trim()
    let dir = path.join('build', 'intermediate', "db", "armory_item_slot_blacklists_tables")
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true })
    }
    const tableName = `ZZ_${projectName}_${randomNumbering}_armory_data.tsv`
    const tsv = header + out
    fs.writeFileSync(path.join(dir, tableName), tsv)
}

function GenerateCsv_armory_item_to_category_sets_tables(data, projectName) {

    const randomNumbering = Math.floor(Math.random() * 1000000)
    const header = `armory_item	category_set\n` +
    `#armory_item_to_category_sets_tables;0;db/armory_item_to_category_sets_tables/ZZ_${projectName}_${randomNumbering}_armory_data	\n`

    let out = ""
    for (const item of data) {
        out += `${item.armory_item}	${item.category_set}\n`
    }

    const result = (header + out).trim()
    let dir = path.join('build', 'intermediate', "db", "armory_item_to_category_sets_tables")
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true })
    }
    const tableName = `ZZ_${projectName}_${randomNumbering}_armory_data.tsv`
    const tsv = header + out
    fs.writeFileSync(path.join(dir, tableName), tsv)
}

function GenerateCsv_armory_item_ui_infos_tables(data, projectName) {

    const randomNumbering = Math.floor(Math.random() * 1000000)
    const header = `armory_item	type\n` +
    `#armory_item_ui_infos_tables;1;db/armory_item_ui_infos_tables/ZZ_${projectName}_${randomNumbering}_armory_data	\n`

    let out = ""
    for (const item of data) {
        out += `${item.armory_item}	${item.type}\n`
    }

    const result = (header + out).trim()
    let dir = path.join('build', 'intermediate', "db", "armory_item_ui_infos_tables")
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true })
    }
    const tableName = `ZZ_${projectName}_${randomNumbering}_armory_data.tsv`
    const tsv = header + out
    fs.writeFileSync(path.join(dir, tableName), tsv)
}

function GenerateCsv_armory_item_variant_ui_infos_tables(data, projectName) {

    const randomNumbering = Math.floor(Math.random() * 1000000)
    const header = `key\n` +
    `#armory_item_variant_ui_infos_tables;0;db/armory_item_variant_ui_infos_tables/ZZ_${projectName}_${randomNumbering}_armory_data	\n`

    let out = ""
    for (const item of data) {
        out += `${item.key}\n`
    }

    const result = (header + out).trim()
    let dir = path.join('build', 'intermediate', "db", "armory_item_variant_ui_infos_tables")
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true })
    }
    const tableName = `ZZ_${projectName}_${randomNumbering}_armory_data.tsv`
    const tsv = header + out
    fs.writeFileSync(path.join(dir, tableName), tsv)
}

function GenerateCsv_armory_item_variants_tables(data, projectName) {

    const randomNumbering = Math.floor(Math.random() * 1000000)
    const header = `armory_item	variant	battle_animation	campaign_animation	use_as_default	ui_info\n` +
    `#armory_item_variants_tables;0;db/armory_item_variants_tables/ZZ_${projectName}_${randomNumbering}_armory_data	\n`

    let out = ""
    for (const item of data) {
        out += `${item.armory_item}	${item.variant}	${item.battle_animation ?? ""}	${item.campaign_animation ?? ""}	${item.use_as_default}	${item.ui_info}\n`
    }

    const result = (header + out).trim()
    let dir = path.join('build', 'intermediate', "db", "armory_item_variants_tables")
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true })
    }
    const tableName = `ZZ_${projectName}_${randomNumbering}_armory_data.tsv`
    const tsv = header + out
    fs.writeFileSync(path.join(dir, tableName), tsv)
}

function GenerateCsv_armory_items_tables(data, projectName) {

    const randomNumbering = Math.floor(Math.random() * 1000000)
    const header = `key	slot_type\n` +
    `#armory_items_tables;0;db/armory_items_tables/ZZ_${projectName}_${randomNumbering}_armory_data	\n`

    let out = ""
    for (const item of data) {
        out += `${item.key}	${item.slot_type}\n`
    }

    const result = (header + out).trim()
    let dir = path.join('build', 'intermediate', "db", "armory_items_tables")
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true })
    }
    const tableName = `ZZ_${projectName}_${randomNumbering}_armory_data.tsv`
    const tsv = header + out
    fs.writeFileSync(path.join(dir, tableName), tsv)
}

function GenerateCsv_armory_items_to_effects_tables(data, projectName) {
    const randomNumbering = Math.floor(Math.random() * 1000000)
    const header = `armory_item	effect	effect_scope	value\n`+
    `#armory_items_to_effects_tables;0;db/armory_items_to_effects_tables/ZZ_${projectName}_${randomNumbering}_armory_data	\n`

    let out = ""
    for (const item of data) {
        const ancillaryData = GetAncillaryByKey(item.AssociatedAncillaryKey)
        if(ancillaryData == null) continue

        for (const effect of ancillaryData.Effects) {
            out += `${item.ItemName}	${effect.EffectKey}	${effect.Scope}	${effect.Value}		\n`
        }
    }

    const result = (header + out).trim()
    let dir = path.join('build', 'intermediate', "db", "armory_items_to_effects_tables")
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true })
    }
    const tableName = `ZZ_${projectName}_${randomNumbering}_armory_data.tsv`
    const tsv = header + out
    fs.writeFileSync(path.join(dir, tableName), tsv)

}

function GenerateCsv_battle_skeleton_parts_tables(data, projectName) {

    const randomNumbering = Math.floor(Math.random() * 1000000)
    const header = `variant_name	skeleton	root_joint\n` +
    `#battle_skeleton_parts_tables;1;db/battle_skeleton_parts_tables/ZZ_${projectName}_${randomNumbering}_armory_data	\n`

    let out = ""
    for (const item of data) {
        out += `${item.variant_name}	${item.skeleton}		\n`
    }

    const result = (header + out).trim()
    let dir = path.join('build', 'intermediate', "db", "battle_skeleton_parts_tables")
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true })
    }
    const tableName = `ZZ_${projectName}_${randomNumbering}_armory_data.tsv`
    const tsv = header + out
    fs.writeFileSync(path.join(dir, tableName), tsv)
}

function GenerateCsv_variants_tables(data, projectName) {

    const randomNumbering = Math.floor(Math.random() * 1000000)
    const header = `variant_name	tech_folder	variant_filename	low_poly_filename	mount_scale	scale	scale_variation	super_low_poly_filename\n` +
    `#variants_tables;6;db/variants_tables/ZZ_${projectName}_${randomNumbering}_armory_data	\n`

    let out = ""
    for (let item of data) {
        if(item.mount_scale == "") item.mount_scale = 1
        let variantFileName = item.variant_filename

        if(item.VariantMeshDefinitionShouldCreate) {
            variantFileName = `autogenerated/${item.variant_name}`
        }

        out += `${item.variant_name}	${item.tech_folder ?? ""}	${variantFileName ?? ""}		${item.mount_scale ?? 1}	${item.scale ?? 1}	0	\n`
    }

    const result = (header + out).trim()
    let dir = path.join('build', 'intermediate', "db", "variants_tables")
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true })
    }
    const tableName = `ZZ_${projectName}_${randomNumbering}_armory_data.tsv`
    const tsv = header + out
    fs.writeFileSync(path.join(dir, tableName), tsv)
}

//console.log("Processing agent_subtypes_to_armory_item_sets_tables")
//GenerateCsv_agent_subtypes_to_armory_item_sets_tables(GenerateArmoryAgentSubtypesToArmoryItemSets(), PROJECT_NAME)

console.log("Processing armory_item_set_items_tables")
GenerateCsv_armory_item_set_items_tables(GenerateArmoryItemSetItems(), PROJECT_NAME)
GenerateCsv_armory_item_set_items_tables(GenerateDummyArmoryItemSetItems(), PROJECT_NAME + "_default")

console.log("Processing armory_item_sets_tables")
GenerateCsv_armory_item_sets_tables(GenerateArmoryItemSets(), PROJECT_NAME)

console.log("Processing armory_item_slot_blacklists_tables")
GenerateCsv_armory_item_slot_blacklists_tables(GenerateArmoryItemSlotBlacklists(), PROJECT_NAME)

console.log("Processing armory_item_to_category_sets_tables")
GenerateCsv_armory_item_to_category_sets_tables(GenerateArmoryItemToCategorySets(), PROJECT_NAME)
GenerateCsv_armory_item_to_category_sets_tables(GenerateDummyArmoryItemToCategorySets(), PROJECT_NAME + "_default")

console.log("Processing armory_item_ui_infos_tables")
GenerateCsv_armory_item_ui_infos_tables(GenerateArmoryItemUiInfos(), PROJECT_NAME)
GenerateCsv_armory_item_ui_infos_tables(GenerateDummyArmoryItemUiInfos(), PROJECT_NAME + "_default")

console.log("Processing armory_item_variant_ui_infos_tables")
GenerateCsv_armory_item_variant_ui_infos_tables(GenerateArmoryItemVariantUiInfos(), PROJECT_NAME)
GenerateCsv_armory_item_variant_ui_infos_tables(GenerateDummyArmoryItemVariantUiInfos(), PROJECT_NAME  + "_default")

console.log("Processing armory_item_variants_tables")
GenerateCsv_armory_item_variants_tables(GenerateArmoryItemVariants(), PROJECT_NAME)
GenerateCsv_armory_item_variants_tables(GenerateDummyArmoryItemVariants(), PROJECT_NAME + "_default")

console.log("Processing armory_items_tables")
GenerateCsv_armory_items_tables(GenerateArmoryItems(), PROJECT_NAME)
GenerateCsv_armory_items_tables(GenerateDummyArmoryItems(), PROJECT_NAME + "_default")

console.log("Processing armory_items_to_effects_tables")
GenerateCsv_armory_items_to_effects_tables(ArmouryDefs, PROJECT_NAME)

console.log("Processing battle_skeleton_parts_tables")
GenerateCsv_battle_skeleton_parts_tables(GenerateBattleSkeletonParts(), PROJECT_NAME)
GenerateCsv_battle_skeleton_parts_tables(GenerateDummyBattleSkeletonParts(), PROJECT_NAME + "_default")

console.log("Processing variants_tables")
GenerateCsv_variants_tables(GenerateVariants(), PROJECT_NAME)
GenerateCsv_variants_tables(GenerateDummyVariants(), PROJECT_NAME + "_default")


function CreateLocalisation(projectName) {
    const header = `key	text	tooltip\n` +
    `#Loc;1;text/db/localisation_${projectName}_armory_data.loc	\n`

    let out = ""
    for (let item of ArmouryDefs) {

        out += `armory_item_ui_infos_localised_name_${item.ItemName}	${item.LocalisedName}	false\n`
        out += `armory_item_ui_infos_description_${item.ItemName}	${item.Description}	false\n`
    }

    const result = (header + out).trim()
    let dir = path.join('build', 'intermediate', "text", "db")
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true })
    }
    const tableName = `localisation_${projectName}_armory_data.tsv`
    const tsv = header + out
    fs.writeFileSync(path.join(dir, tableName), tsv)
}

function CreateDummyLocalisation(data, projectName) {
    const header = `key	text	tooltip\n` +
    `#Loc;1;text/db/dummy_localisation_${projectName}_armory_data.loc	\n`

    let out = ""
    for (let item of data) {

        out += `armory_item_ui_infos_localised_name_${item.key}	${"None"}	false\n`
        out += `armory_item_ui_infos_description_${item.key}	${"No item in the slot"}	false\n`
    }

    const result = (header + out).trim()
    let dir = path.join('build', 'intermediate', "text", "db")
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true })
    }
    const tableName = `dummy_localisation_${projectName}_armory_data.tsv`
    const tsv = header + out
    fs.writeFileSync(path.join(dir, tableName), tsv)
}

console.log("Creating localisation")
CreateLocalisation(PROJECT_NAME)
CreateDummyLocalisation(GenerateDummyArmoryItemVariantUiInfos(), PROJECT_NAME)

/**
 * TODO: Place the icons too!
 */

function CopyIcons() {
    let dir = path.join('build', 'intermediate', "ui", "campaign ui", "daemon_prince_gifts_icons")
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true })
    }


    for (const item of ArmouryDefs) {
        let dir = path.join('build', 'intermediate', "ui", "campaign ui", "daemon_prince_gifts_icons")
        const uiIcon = item.UiIcon

        if(!uiIcon) continue

        const icon = path.isAbsolute(uiIcon) ? uiIcon : path.join(__dirname, '..', uiIcon)
        dir = path.join(dir, path.basename(icon))

        fs.copyFileSync(icon, dir)
    }
}

function CopyPortholes() {
    let dir = path.join('build', 'intermediate', "ui", "portraits", "portholes", "dae_prince")
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true })
    }


    for (const item of ArmouryDefs) {
        let dir = path.join('build', 'intermediate', "ui", "portraits", "portholes", "dae_prince")
        const porthole = item.Thumbnail
        if(!porthole) continue


        const picture = path.isAbsolute(porthole) ? porthole : path.join(__dirname, '..', porthole)
        dir = path.join(dir, path.basename(picture))

        fs.copyFileSync(porthole, dir)
    }
}

function CopyCards() {
    let dir = path.join('build', 'intermediate', "ui", "portraits", "units", "dae_prince")
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true })
    }


    for (const item of ArmouryDefs) {
        let dir = path.join('build', 'intermediate', "ui", "portraits", "units", "dae_prince")
        const porthole = item.UnitCardThumbnail
        if(!porthole) continue

        const picture = path.isAbsolute(porthole) ? porthole : path.join(__dirname, '..', porthole)
        dir = path.join(dir, path.basename(picture))

        fs.copyFileSync(porthole, dir)
    }
}

function InsertDummyAssets() {
    const seen = new Set();

    for (const object of ArmouryData) {
        seen.add(object.Skeleton);
    }

    const Skeletons = Array.from(seen)
    
    const fileRequiredAssetName = path.join("required_assets", "transparent_wings.png")
    const fileRequiredAssetName2 = path.join("required_assets", "transparent_wings2.png")
    const fileRequiredAssetName3 = path.join("required_assets", "no_item.png")
    
    const output = []
    for (const skeleton of Skeletons) {
        {
            const dummyPortholeName = `const_kitbasher_dummy_wings__${skeleton}.png`
            const dummyPortholeNameMask = `const_kitbasher_dummy_wings__${skeleton}_mask1.png`

            const dest1 = path.join("build", "intermediate", "ui", "portraits", "portholes", "dae_prince", dummyPortholeName)
            fs.copyFileSync(fileRequiredAssetName, dest1)
            const dest2 = path.join("build", "intermediate", "ui", "portraits", "portholes", "dae_prince",  dummyPortholeNameMask)
            fs.copyFileSync(fileRequiredAssetName, dest2)
        }
        
        {
            const dummyPortholeName = `const_kitbasher_dummy_wings__${skeleton}.png`
            const dummyPortholeNameMask = `const_kitbasher_dummy_wings__${skeleton}_mask1.png`

            const dest1 = path.join("build", "intermediate", "ui", "portraits", "units", "dae_prince", dummyPortholeName)
            fs.copyFileSync(fileRequiredAssetName2, dest1)
            const dest2 = path.join("build", "intermediate", "ui", "portraits", "units", "dae_prince",  dummyPortholeNameMask)
            fs.copyFileSync(fileRequiredAssetName2, dest2)
        }

        //dummy
        {
            const dummyIconName = `const_kitbasher_dummy_wings__${skeleton}.png`

            let dir = path.join('build', 'intermediate', "ui", "campaign ui", "daemon_prince_gifts_icons", dummyIconName)
            fs.copyFileSync(fileRequiredAssetName3, dir)
        }

        //cape
        {
            const dummyIconName = `const_kitbasher_dummy_arm_left__${skeleton}.png`

            let dir = path.join('build', 'intermediate', "ui", "campaign ui", "daemon_prince_gifts_icons", dummyIconName)
            fs.copyFileSync(fileRequiredAssetName3, dir)
        }

        //pauldrons
        {
            const dummyIconName = `const_kitbasher_dummy_arm_right__${skeleton}.png`

            let dir = path.join('build', 'intermediate', "ui", "campaign ui", "daemon_prince_gifts_icons", dummyIconName)
            fs.copyFileSync(fileRequiredAssetName3, dir)
        }

        //talisman
        {
            const dummyIconName = `const_kitbasher_dummy_tail__${skeleton}.png`

            let dir = path.join('build', 'intermediate', "ui", "campaign ui", "daemon_prince_gifts_icons", dummyIconName)
            fs.copyFileSync(fileRequiredAssetName3, dir)
        }
    }
}

console.log("Copying icons")
CopyIcons()

console.log("Copying portholes")
CopyPortholes()

console.log("Copying cards")
CopyCards()

console.log("Injecting dummy assets")
InsertDummyAssets()

function TransformArmouryDefsToSubtype() {
    const result = {}

    for (const item of ArmouryDefs) {
        if (item.IsItemDefinedFromAncillary) {
            const subtypeKeys = item.SubtypeKeys
            for (const subtypeKey of subtypeKeys) {
                const itemName = item.ItemName
                const associatedAncillaryKey = item.AssociatedAncillaryKey

                if (!result[subtypeKey]) {
                    result[subtypeKey] = {}
                }

                result[subtypeKey][itemName] = associatedAncillaryKey
            }
        }
    }

    return result
}

function GenerateItemMappings() {
    const output = {}

    for (const iterator of ArmouryDefs) {
        const ancillaryData = GetAncillaryByKey(iterator.AssociatedAncillaryKey)
        let powerLevel = 0
        if(ancillaryData != null) {
            powerLevel = ancillaryData.PowerLevel
        }

        if(iterator.Type == "head") output[iterator.ItemName] = {
            Powerlevel: powerLevel,
            Type: "head"
        }
        if(iterator.Type == "cape") output[iterator.ItemName] = {
            Powerlevel: powerLevel,
            Type: "cape"
        }
        if(iterator.Type == "torso") output[iterator.ItemName] = {
            Powerlevel: powerLevel,
            Type: "torso"
        }
        if(iterator.Type == "legs") output[iterator.ItemName] = {
            Powerlevel: powerLevel,
            Type: "legs"
        }
        if(iterator.Type == "pauldrons") output[iterator.ItemName] = {
            Powerlevel: powerLevel,
            Type: "pauldrons"
        }
        if(iterator.Type == "2handed" || iterator.Type ==  "1handed") output[iterator.ItemName] = {
            Powerlevel: powerLevel,
            Type: "weapon"
        }
        if(iterator.Type == "shield") output[iterator.ItemName] = {
            Powerlevel: powerLevel,
            Type: "shield"
        }
        if(iterator.Type == "talisman") output[iterator.ItemName] = {
            Powerlevel: powerLevel,
            Type: "talisman"
        }
    }

    return output
}

function FindPreferencedItem(whichItem) {
    for (const iterator of ArmouryDefs) {
        if(iterator.ItemName != whichItem) continue

        return iterator.PreferencedItems
    }

    return null
}

function BuildScript() {

    const dir = path.join('build', 'intermediate', "ts")
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true })
    }

    const headerPath = path.join("campaign", "mod", "Header_BretonniaInGameKitbashKitbashedCharacter.d.ts")
    const targetHeaderPath = path.join('build', 'intermediate', "ts", "Header_BretonniaInGameKitbashKitbashedCharacter.d.ts")

    //fs.copyFileSync(headerPath, targetHeaderPath)
    const transformedData = TransformArmouryDefsToSubtype()

    const randomNumbering = Math.floor(Math.random() * 1000000)
    let out =  ""
    for (const iterator of ArmouryData) {


        const defaultArmorySet = iterator.DefaultArmoryItemSet
        const SubtypeKey = iterator.SubtypeKey

        let specialItems = transformedData[SubtypeKey]
        if(!specialItems) specialItems = {}

        const specialItemsSerialised = JSON.stringify(specialItems)

        let preferencedItems = {}
        if(specialItems) {
            const specialItemNames = Object.keys(specialItems)
            for (const iterator of specialItemNames) {
                preferencedItems[iterator] = FindPreferencedItem(iterator)
            }
        }

        preferencedItems = JSON.stringify(preferencedItems)

        const registerTemplate = `
BretonniaInGameKitbash.KitbashedCharacter.Register(
    "${SubtypeKey}", {
    specialItems : ${specialItemsSerialised},
    defaultArmorySet: "${defaultArmorySet}",
    armouryItemPreferences: ${preferencedItems},
    bCanUseShield: ${iterator.bCanUseShield},
    skeletonType: "${iterator.Skeleton}"
})

`
        out = registerTemplate + out
    }

    const itemTypesData = GenerateItemMappings()

    const out2 = `
    BretonniaInGameKitbash.KitbashedCharacter.RegisterItemValues(${JSON.stringify(itemTypesData)})
    `

    const header = `
namespace AUTOGENERATED_BretonniaInGameKitbashData {
    export class ${PROJECT_NAME}_${randomNumbering} {
        constructor() {
            ${out}
            BretonniaInGameKitbash.KitbashedCharacter.EnableFaction("${FACTION}")
            ${out2}
        }
    }
    new ${PROJECT_NAME}_${randomNumbering}()
}
    `
    const fileName = `ZZ_ZZ_AUTOGENERATED_ZZ_${PROJECT_NAME}_${randomNumbering}_ZZ.ts`

    fs.writeFileSync(path.join(dir, fileName), header)
}

console.log("Building typescript")
BuildScript()

function CompileTypescriptProject() {
    const currentPath = process.cwd()
    const script = path.join(currentPath, "build_campaign.bat")
    console.log(script)
    const result = spawnSync(script, [], {
        stdio: "inherit",
        encoding: 'utf8',
        shell: true
    })

    if(result.status != 0) {
        console.error("Typescript encounter a compiler error, please check your project in campaign/mod")
        console.error("code: " + result.status)

        if (result.error) {
            console.error('Error executing script:', result.error);
        }

        throw "compiler error"
    }
}

console.log("compiling typescript project")
CompileTypescriptProject()

function BuildPack() {
    console.log("Compiling pack...")

    const destination = path.join('build', `@autogenerated_${PROJECT_NAME}.pack`)

    /*disabled*/
    //const agent_subtypes_to_armory_item_sets_tables = path.join('build', 'intermediate', "db", "agent_subtypes_to_armory_item_sets_tables")
    const armory_item_set_items_tables = path.join('build', 'intermediate', "db", "armory_item_set_items_tables")
    const armory_item_sets_tables = path.join('build', 'intermediate', "db", "armory_item_sets_tables")
    const armory_item_slot_blacklists_tables = path.join('build', 'intermediate', "db", "armory_item_slot_blacklists_tables")
    const armory_item_to_category_sets_tables = path.join('build', 'intermediate', "db", "armory_item_to_category_sets_tables")
    const armory_item_ui_infos_tables = path.join('build', 'intermediate', "db", "armory_item_ui_infos_tables")
    const armory_item_variant_ui_infos_tables = path.join('build', 'intermediate', "db", "armory_item_variant_ui_infos_tables")
    const armory_item_variants_tables = path.join('build', 'intermediate', "db", "armory_item_variants_tables")
    const armory_items_tables = path.join('build', 'intermediate', "db", "armory_items_tables")
    const armory_items_to_effects_tables = path.join("build", "intermediate", "db", "armory_items_to_effects_tables")
    const battle_skeleton_parts_tables = path.join('build', 'intermediate', "db", "battle_skeleton_parts_tables")
    const variants_tables = path.join('build', 'intermediate', "db", "variants_tables")
    
    const localisation = path.join('build', 'intermediate', "text", "db")

    const daemon_prince_gifts_icons = path.join('build', 'intermediate', "ui", "campaign ui", "daemon_prince_gifts_icons")
    const dae_prince = path.join('build', 'intermediate', "ui", "portraits", "portholes", "dae_prince")
    const dae_prince_unitCard = path.join('build', 'intermediate', "ui", "portraits", "units", "dae_prince")

    const variantmeshes = path.join('build', 'intermediate', "variantmeshes", "variantmeshdefinitions", "autogenerated")
    
    const script = path.join("script", 'build', 'intermediate', "ts")
    
    const campaignScript = path.join("script", 'campaign', 'mod')
    const additionalParams = []
    if (fs.existsSync(campaignScript)) {
        additionalParams.push(`--folder-path`, `${campaignScript};script/campaign/mod`)
    }

    try {
        fs.unlinkSync(destination)
    } catch (error) {
        
    }

    spawnSync(`${RPFM_EXE}`, [
        '--game', 'warhammer_3', 
        'pack', 
        `create` , `--pack-path` , destination,   
    ], {
        stdio: "inherit",
        encoding: 'utf8'
    })

    if(PACK_FILE_TO_MERGE) {

        console.log("Merging pack...")
        
        spawnSync(`${RPFM_EXE}`, [
            '--game', 'warhammer_3', 
            'pack', 
            `merge` , 
            `--source-pack-paths` , PACK_FILE_TO_MERGE,
            `--save-pack-path`, destination
        ], {
            stdio: "inherit",
            encoding: 'utf8'
        })
    }

    spawnSync(`${RPFM_EXE}`, [
        '--game', 'warhammer_3', 
        'pack', 
        `add`, `--pack-path` , destination, 

        `--tsv-to-binary`, `${SCHEMA_PATH}`,
        //`--folder-path`, `${agent_subtypes_to_armory_item_sets_tables}`,
        `--folder-path`, `${armory_item_set_items_tables}`,
        `--folder-path`, `${armory_item_sets_tables}`,
        `--folder-path`, `${armory_item_slot_blacklists_tables}`,
        `--folder-path`, `${armory_item_to_category_sets_tables}`,
        `--folder-path`, `${armory_item_ui_infos_tables}`,
        `--folder-path`, `${armory_item_variant_ui_infos_tables}`,
        `--folder-path`, `${armory_item_variants_tables}`,
        `--folder-path`, `${armory_items_tables}`,
        `--folder-path`, `${armory_items_to_effects_tables}`,
        `--folder-path`, `${battle_skeleton_parts_tables}`,
        `--folder-path`, `${variants_tables}`,

        `--folder-path`, `${localisation}`,

        `--folder-path`, `${variantmeshes};variantmeshes/variantmeshdefinitions/autogenerated`,

        `--folder-path`, `${daemon_prince_gifts_icons};ui/campaign ui/daemon_prince_gifts_icons`,
        `--folder-path`, `${dae_prince};ui/portraits/portholes/dae_prince`,
        `--folder-path`, `${dae_prince_unitCard};ui/portraits/units/dae_prince`,

        `--folder-path`, `${script};script/campaign/mod`,
        

    ].concat(additionalParams), 
    { encoding: 'utf8', stdio: 'inherit'})
    console.log(`Done for "${PROJECT_NAME}"`)
}

BuildPack()


if(CLEAN_AFTER_COMPILE) {
    ClearDirectory()
}