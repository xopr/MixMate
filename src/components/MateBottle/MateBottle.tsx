import { styled } from "@suid/material";
import { Component } from "solid-js";
import { MateColors, type MateBottleProps } from ".";
import { StyledProps } from "@suid/system/styledProps";

const MateBottleStyled = styled("span", {
    // shouldForwardProp: (prop: string) => ["block", "colors"].includes(prop)
})<MateBottleProps>(
{
    display: "inline-block",
    width: "7vw",
    aspectRatio: "1/4",
    position: "relative",
    transition: "transform 200ms",
    margin: "1.5vw",
    opacity: "0.8",
    "&:before": {
        content: '""',
        display: "block",
        height: "100%",
        "mask-image": 'url("mate-fill.svg")',
        "mask-position": "center",
        "mask-size": "cover",
        "-webkit-mask-image": 'url("mate-fill.svg")',
        "-webkit-mask-position": "center",
        "-webkit-mask-size": "cover",
      },
      "&:after": {
        content: '""',
        display: "block",
        top: 0,
        position: "absolute",
        height: "100%",
        width: "100%",
        backgroundColor: "#333",
        "mask-image": 'url("mate-outline.svg")',
        "mask-position": "center",
        "mask-size": "cover",
        "-webkit-mask-image": 'url("mate-outline.svg")',
        "-webkit-mask-position": "center",
        "-webkit-mask-size": "cover",
      },
} as StyledProps,
(props) => {
    const { colors, count, selected, active } = props.props as MateBottleProps;

    const gradientColors = [];
    const offset = 7
    const factor = 84.7 - offset;

    let color;
    for (let c = 0; c < count; ++c)
    {
        const percentage = c / count * factor + offset;
        if (c)
            gradientColors.push( `${color} ${percentage}%` )

        color = MateColors[colors[c]] || "transparent";

        gradientColors.push( `${color} ${percentage}%` )
    }
    gradientColors.push( `${color} 100%` )

    const gradient = `linear-gradient(0deg, ${gradientColors.join(", ")})`;

    return {
        transform: `scale(${active ? "1.1" : "1.0"}) translate(0, ${selected ? "-10%" : "0"})`,
        
        "&:before": {
            background: gradient,
        }
    };
});

export const MateBottle: Component<MateBottleProps> = (props) => {
    return (
        <MateBottleStyled {...props} />
    )
};
