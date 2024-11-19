# scripting in typescript on this framework

1. Generate new project using this tool https://github.com/admiralnelson/warhammer3-typescript-framework
2. Copy campaign, runtime, typescript-global.d.ts, user-interface-header.d.ts, warhammer-header.ts, warhammer-cco-header.d.ts into this folder
3. You can delete that new project
4. Start scripting in typescript and interact with exposed BretonniaInGameKitbash API

## API caveat
1. When the current faction is human, keep at least 1 seconds delay when awarding multiple ancillaries to the lord, or use AddArmouryItem instead with provided armoury item key
2. When the current faction is AI, use AddArmouryItem instead with provided armoury item key during start faction turn event