import { Text3D, Center } from "@react-three/drei"
import Shader from "./Shader"

export default function Experience()
{
    return <>
        {/* <mesh>
            <boxGeometry />
            <meshNormalMaterial />
        </mesh> */}
        <Center>
            <Text3D letterSpacing={-0.06} size={0.5} font="./Inter_Bold.json">
                Welcome!
                <meshNormalMaterial />
            </Text3D>
        </Center>
        <Shader />
    </>
}