export enum MateNames {
    MATE,
    WINTER,
    COLA,
    GRANAT,
    ICE_T,
    ZERO,
}

export const MateColors: { [key in MateNames] : string } = {
    [MateNames.MATE]:   "#EEAC00", // 1924 (1994)
    [MateNames.WINTER]: "#B34C00", // 2007
    [MateNames.COLA]:   "#340900", // 2009
    [MateNames.GRANAT]: "#FF004C", // 2013
    [MateNames.ICE_T]:  "#C97400",
    [MateNames.ZERO]:   "#D9D629", // 2022
}

export type MateBottleProps = {
    colors: Array<MateNames>;
    count: number;
    selected?: boolean; 
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
}

export * from "./MateBottle"
