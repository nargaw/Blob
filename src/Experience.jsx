import { Text3D, Center, Float, Stage } from "@react-three/drei"
import Shader from "./Shader"

export default function Experience()
{
    return <>
        <Stage adjustCamera={0.2}>
            <Center>
                <Float>
                    <Text3D letterSpacing={-0.06} size={0.75} font="./Inter_Bold.json">
                        Welcome!
                        <meshNormalMaterial />
                    </Text3D>
                </Float>
                
            </Center>
            <Shader />
        </Stage>
    </>
}