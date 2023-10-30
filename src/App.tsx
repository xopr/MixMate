import { Button } from "@suid/material";
import { Component, createSignal, For } from "solid-js";
import { MateBottle, MateNames } from "./components/MateBottle";

const MAX_COLORS = 6;
const MAX_DIFFICULTY = 20;

const [difficulty, setDifficulty] = createSignal(15);
const [colorCount, setColorCount] = createSignal(6);
const [spare, setSpare] = createSignal(2);

const [bottles, setBottles] = createSignal<Array<Array<MateNames>>>([])
const [source, setSource] = createSignal<number | undefined>();
const [target, setTarget] = createSignal<number | undefined>();

const [busy, setBusy] = createSignal(false);
const [winner, setWinner] = createSignal(false);

function rand(max: number = 255): number {
    var buf = new Uint8Array(1);

    if (max === 1) return 0;

    let retVal: number;
    // Avoid pidgeon hole problem
    do
    {
        retVal = crypto.getRandomValues(buf)[0];

    } while (retVal < 0 || retVal >= max)

    return retVal;
}


// From https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle<T extends any[]>(array: T): T 
{
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle.
    while (currentIndex > 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(rand(currentIndex));
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array;
}

function pourLiquid<T extends Array<Array<any>>>(sourceArray: T, sourceIndex: number, targetIndex: number, maxLength: number): T
{
    const array = sourceArray.map(sourceItem => {
        return sourceItem.map(color => color);
    }) as T;

    let source = array[sourceIndex];
    let sourceLength = source.length;
    let sourceColor = source[sourceLength - 1];

    let target = array[targetIndex];
    let targetLength = target.length;
    let targetColor = target[targetLength - 1];

    // Full source length must fit on target
    let lastLiquidLength = 0;
    for (let n = sourceLength - 1; n>= 0; --n)
    {
        if (sourceColor === source[n])
            lastLiquidLength++;
        else
            break;
    }

    if( targetLength === maxLength) return array;
    if ( targetLength + lastLiquidLength > maxLength )
        return array;

    while (true)
    {
        const sourceColor = array[sourceIndex].pop();
        // Color didn't match: put it back
        if (!targetLength) targetColor = sourceColor;

        if (sourceColor !== targetColor && targetLength < maxLength)
        {
            array[sourceIndex].push(sourceColor);
            break;
        }
        else
        {
            array[targetIndex].push(sourceColor);
            targetLength++;
        }

        if( targetLength === maxLength) break;
    }
    return array;
}

function hasPossibleStep(array: any, sourceIndex: number, targetIndex: number, mixAmount: number, oldSourceIndex?: number, oldTargetIndex?: number): boolean
{
    // No tick-tock
    if (oldSourceIndex == targetIndex && oldTargetIndex === sourceIndex)
        return false;

    const target = array[targetIndex];
    let targetColor;
    let targetLength = 0;
    for (let n = target.length - 1; n>= 0; --n)
    {
        if (!targetColor)
            targetColor = target[n];

        if (targetColor === target[n])
            targetLength++;
    }

    const source = array[sourceIndex];
    const sourceColor = source[target.length - 1];

    // Cannot pour back!
    if ( sourceColor !== targetColor)
        return false;

    // Result of pouring back doesn't fit the bottle
    if (target.length + targetLength > mixAmount)
        return false;

    return true;
}

function mixDrinks<T extends Array<Array<MateNames>>>(array: T, colorCount: number, mixAmount: number): T
{
    let times = mixAmount;

    let oldSourceIndex, oldTargetIndex;
    while (--times)
    {
        // Get available and source indexes
        const targetEntries = array.reduce((r,e,i) => {
            if (e.length < colorCount) r.push(i);
            return r;
        }, [] as number[]);
        const sourceEntries = array.reduce((r,e,i) => {
            if (e.length) r.push(i);
            return r;
        }, [] as number[]);

        const targetIndex = targetEntries[rand(targetEntries.length)];
        const sourceIndex = sourceEntries[rand(sourceEntries.length)];

        const targetFreeSpace = colorCount - array[targetIndex].length;
        const sourceLength = array[sourceIndex].length;

        // Full source length must fit on target
        let sourceColor;
        let lastLiquidLength = 0;
        for (let n = sourceLength - 1; n>= 0; --n)
        {
            if (!sourceColor)
                sourceColor = array[n];

            if (sourceColor === array[n])
                lastLiquidLength++;
            else
                break;
        }

        const repeat = Math.max(1, rand(Math.min(lastLiquidLength, targetFreeSpace)));

        for (let r = 0; r < repeat; ++r)
        {
            const color = array[sourceIndex].pop();
            array[targetIndex].push(color!);

            // TODO: remember previous step so we don't tic-toc
            if (!hasPossibleStep(array, sourceIndex, targetIndex, mixAmount, oldSourceIndex, oldTargetIndex ))
            {
                const color = array[targetIndex].pop();
                array[sourceIndex].push(color!);
            }

        }

        const mixedBottleCount = array.filter(bottle => {
            let savedColor: MateNames;
            bottle.filter(color => {
                if (color !== savedColor)
                {
                    color = savedColor;
                    return true;
                }
            }).length !== 1;
        }).length;

        if (mixedBottleCount === mixAmount)
            break;
            
        // Store old indices 
        oldSourceIndex = sourceIndex;
        oldTargetIndex = targetIndex;
    }

    // TODO: create list of bottles that only have 1 liquid (single color, and are mostly full)
    const singleColorBottles = array.reduce((r,e,i) => {
        let firstColor: MateNames;
        if (e.every(c => {
            if (firstColor === undefined)
                firstColor = c;
            return firstColor === c;
        })) {
            r.push(i);
        }
        return r;
    }, [] as number[]).sort((a, b) => {
        if (array[a].length > array[b].length)
            return -1;
        if (array[b].length < array[b].length)
            return 1;
        return 0;
    });

    const targetEntries = array.reduce((r,e,i) => {
        // Don't include the single color sources since we might drop liquid on it. 
        // if (e.length < colorCount && !singleColorBottles.includes(i)) r.push(i);
        if (e.length < colorCount) r.push(i);
        return r;
    }, [] as number[]);

    if (singleColorBottles.length > targetEntries.length)
        singleColorBottles.length = targetEntries.length;

    while( singleColorBottles.length)
    {
        const singleIndex = singleColorBottles.pop()!;
        const targetIndex = targetEntries.splice(targetEntries.length * Math.random(), 1)[0];
        const removeSingleIndex = singleColorBottles.indexOf(targetIndex);
        // Remove from the single color index list
        if (removeSingleIndex >= 0)
            singleColorBottles.splice(targetEntries.length * Math.random(), 1);

        //singleIndex
        while ( array[targetIndex].length < colorCount && array[singleIndex].length && targetIndex !== singleIndex )
        {
            array[targetIndex].push(array[singleIndex].pop()!);    
        }
    }

    // console.log("src, tgt", singleColorBottles, targetEntries);

    return array;
}

function determineWinner(bottles: Array<Array<MateNames>>, colorCount: number ): boolean {
    let oldColor: MateNames;
    return bottles.every(colors => colors.every((color, n) => {
        // Full bottle?
        if (colors.length !== colorCount)
            return false;
        if (!n)
            oldColor = color;
        // I can't even; somewhere a pop is done on an empty array
        if (color === undefined)
            return true;
        // Same color?
        return oldColor === color;
    }));
    return false;
}

const App: Component = () => {
    const restart = () => {

        setWinner(false);

        // Create list of bottles with colors on order
        const newBottles = [];
        const maxColors = Math.min(difficulty(), colorCount());
        for (let full = 0; full < maxColors; ++full)
        {
            newBottles.push(new Array(difficulty()).fill(full));
        }

        for (let full = 0; full < spare(); ++full)
        {
            // No colors
            newBottles.push([]);
        }

        // Shuffle the botles
        shuffle(newBottles);

        // Do the actual mixup here
        mixDrinks(newBottles, difficulty(), 1000);

        setBottles(newBottles);
    };

    const onBottleClick = (index: number) => {
        if (source() === undefined)
        {
            setSource(index);
        }
        else if (source() === index)
        {
            setSource(undefined);
        }
        else if (target() === undefined)
        {
            setTarget(index);
            setBusy(true);

            // Set a timer that "pours" the liquid and reset afterwards
            setTimeout(() => {
                if (source() === undefined || target() === undefined)
                    return;

                // Background: Set the second to last percentage to last percentage and pop the color.
                // TODO...

                // Copy
                setBottles(pourLiquid(bottles(), source()!, target()!, difficulty()));

                setWinner(determineWinner(bottles(), difficulty()));
            }, 350);

            setTimeout(() => {
                setSource(undefined);
                setTarget(undefined);
                setBusy(false);
            }, 700);
        }
    };

    return (
        <>
            <For each={bottles()}>
            {
                (colors, index) => 
                <MateBottle
                    disabled={busy()}
                    colors={colors}
                    count={difficulty()}
                    onClick={() => {onBottleClick(index())}}
                    active={index() === target()}
                    selected={index() === source()}
                />
            }
            </For>        
            {winner() ? <div style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                "justify-content": "center",
                "align-items": "center",
                "background-image": "url('winrar.png')",
                "background-repeat": "no-repeat",
                "background-position": "center",
                "background-color": "black",
                "z-index": -1,
            }}>WINNER</div> : null}
            <div><Button variant="contained" onclick={restart}>Restart game</Button></div>
            {/* No Slider yet: https://github.com/swordev/suid/blob/main/ROADMAP.md */}
            <div>Difficulty:<input type="range" min="2" max={MAX_DIFFICULTY} value={difficulty()} onChange={(e) => setDifficulty(parseInt(e.target.value))} />{difficulty()}</div>
            <div>Colors:<input type="range" min="2" max={MAX_COLORS} value={colorCount()} onChange={(e) => setColorCount(parseInt(e.target.value))} />{colorCount()}</div>
            <div>Spare:<input type="range" min="1" max="3" value={spare()} onChange={(e) => setSpare(parseInt(e.target.value))} />{spare()}</div>
        </>
    );
};

export default App;
