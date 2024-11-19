# Gotchas when using this framework on custom lord

## Lord uses mount

1. Ensure the lord is a type of "cavalry" not "war_beast"
2. Do not use battle personality table, this will cancel the armoury in battle
3. When working in cavalry animation, ensure that *BOTH* animations rider and mount:
    - on version 7, you can use Keyed Frame Editor in asset editor tools to convert into v7
    - have the same length
    - have the same duration
    - every splices (if there is any) use version 7
    - the rider start and end bone rotations and rider height position are the same to reduce jarring transition during animation loop
4. use cavalry mount tool in asset editor tools to automatically position your rider with the mount saddle
