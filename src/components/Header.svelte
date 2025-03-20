<script>
    import { fade, slide } from "svelte/transition";
    import { onMount } from "svelte";
    import Saos from "saos";

    let ready = false;
    onMount(() => (ready = true));

    // Section Id
    export let Id;
    // First title
    export let header_title_1;
    // Second title
    export let header_title_2;
    // Third title, can be a string or an array
    export let header_title_3;
    // theme toggle
    export let state;

    let text_color = "dark";
    let bg_color = "light";

    if (state == "dark") {
        text_color = "light";
        bg_color = "dark";
    }

    // Rolling text animation logic
    let rollingText1 = "";
    let rollingText2 = "";
    let rollingText3 = "";
    let interval1, interval2, interval3, carouselInterval;

    const randomChars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:',.<>?/~";

    function preprocessText(text) {
        return text.replace(/{(.*?)}/g, '<span class="text-shadows" data-text="$1">$1</span>');
    }

    // Add placeholder texts for layout stability
    let placeholder1 = "";
    let placeholder2 = "";
    let placeholder3 = "";
    
    // Set placeholders immediately when component is mounted
    onMount(() => {
        // Create invisible placeholders with exact same content
        placeholder1 = preprocessText(header_title_1);
        placeholder2 = preprocessText(header_title_2);
        placeholder3 = Array.isArray(header_title_3) 
            ? preprocessText(header_title_3[0]) 
            : preprocessText(header_title_3);
            
        // Start animation after a short delay to ensure placeholders are rendered
        setTimeout(startRollingTextAnimation, 100);
        
        return () => {
            clearInterval(interval1);
            clearInterval(interval2);
            clearInterval(interval3);
            clearInterval(carouselInterval);
        };
    });

    function startRollingTextAnimation() {
        // Start all animations simultaneously
        interval1 = createRollingInterval(
            preprocessText(header_title_1),
            setRollingText1,
            0
        );
        
        interval2 = createRollingInterval(
            preprocessText(header_title_2),
            setRollingText2,
            0
        );

        if (Array.isArray(header_title_3)) {
            // Just a slight delay for dramatic effect
            startCarousel(header_title_3, setRollingText3, 200);
        } else {
            interval3 = createRollingInterval(
                preprocessText(header_title_3),
                setRollingText3,
                200
            );
        }
    }

    function createRollingInterval(text, setter, delay = 0) {
        let currentText = "";
        const plainText = text.replace(/<[^>]+>/g, ""); // Remove HTML tags for rolling logic
        const tags = extractTagsWithPositions(text);
        
        // Track which characters are locked (finalized)
        const lockedChars = new Array(plainText.length).fill(false);
        
        // Characters that appear to be "settling" (almost locked)
        const settlingChars = new Array(plainText.length).fill(0);
        
        return setTimeout(() => {
            const startTime = Date.now();
            // Faster total duration for snappier animation
            const totalDuration = 1200;
            // Smaller delay between characters for more synchronized appearance
            const characterDelay = 40;
            
            const interval = setInterval(() => {
                const elapsedTime = Date.now() - startTime;
                
                if (elapsedTime >= totalDuration + (plainText.length * characterDelay * 0.5)) {
                    // Animation complete - set final text
                    setter(text);
                    clearInterval(interval);
                    return;
                }
                
                // Build the current text with a mix of random and final characters
                let resultText = "";
                let plainIndex = 0;
                
                for (let i = 0; i < plainText.length; i++) {
                    // Calculate when this character should start settling
                    // Use a wave function for more natural progression
                    const charStartTime = i * characterDelay * (1 - (i / plainText.length) * 0.3);
                    const charProgress = elapsedTime - charStartTime;
                    
                    // Character hasn't started animating yet
                    if (charProgress < 0) {
                        resultText += getRandomChar();
                        continue;
                    }
                    
                    // Character is in process of settling
                    if (!lockedChars[i]) {
                        // More aggressive settling curve for smoother locking
                        const settlingProbability = Math.min(1, (charProgress / 250) ** 1.5);
                        
                        if (Math.random() < settlingProbability) {
                            settlingChars[i] += 1 + Math.floor(charProgress / 100);
                            
                            // Progressive locking threshold based on character position
                            const lockThreshold = 2 + Math.floor(i / plainText.length * 2);
                            if (settlingChars[i] > lockThreshold) {
                                lockedChars[i] = true;
                            }
                        }
                        
                        // Either show the final character or a random one
                        resultText += lockedChars[i] ? plainText[i] : getRandomChar();
                    } else {
                        // This character is locked, show the final version
                        resultText += plainText[i];
                    }
                    
                    plainIndex++;
                    
                    // Insert tags at the correct positions
                    const taggedText = insertTagsAtPosition(tags, plainIndex, resultText);
                    if (taggedText !== resultText) {
                        resultText = taggedText;
                    }
                }
                
                setter(resultText);
            }, 20); // Even faster refresh rate for ultra-smooth animation
            
            return interval;
        }, delay);
    }
    
    function getRandomChar() {
        return randomChars[Math.floor(Math.random() * randomChars.length)];
    }
    
    function extractTagsWithPositions(text) {
        const tagRegex = /<[^>]+>/g;
        const plainText = text.replace(/<[^>]+>/g, "");
        const tags = [];
        let match;
        let plainIndex = 0;
        let lastIndex = 0;
        
        while ((match = tagRegex.exec(text)) !== null) {
            // Count plaintext characters before this tag
            const textBeforeTag = text.substring(lastIndex, match.index);
            const plainChars = textBeforeTag.replace(/<[^>]+>/g, "").length;
            
            plainIndex += plainChars;
            tags.push({
                tag: match[0],
                position: plainIndex
            });
            
            lastIndex = match.index + match[0].length;
        }
        
        return tags;
    }
    
    function insertTagsAtPosition(tags, position, text) {
        let result = text;
        // Insert tags that should appear at this position
        for (const tagInfo of tags) {
            if (tagInfo.position === position) {
                result += tagInfo.tag;
            }
        }
        return result;
    }

    function startCarousel(textArray, setter, delay = 0) {
        let index = 0;
        const updateText = () => {
            const text = preprocessText(textArray[index]);
            createRollingInterval(text, setter);
            index = (index + 1) % textArray.length;
        };

        carouselInterval = setInterval(updateText, delay + 3000); // Change every 3 seconds + animation delay
        updateText();
    }

    function setRollingText1(value) {
        rollingText1 = value;
    }

    function setRollingText2(value) {
        rollingText2 = value;
    }

    function setRollingText3(value) {
        rollingText3 = value;
    }

</script>

<!-- Header component -->
<div
    class="text-{text_color} d-flex justify-content-center align-items-center min-vh-100"
    id={Id}
    style="padding-top:58px; background-color: transparent !important;"
>
    <div class="row container">
        <!-- Left Section -->
        <Saos animation={""}>
            {#if ready}
                <div class="col-md-6 mb-3 text-uppercase header-container">
                    <!-- Placeholders to maintain layout (invisible) -->
                    {#if placeholder1 && placeholder2 && placeholder3}
                        <div class="layout-placeholders">
                            <span class="fw-bold d-block display-3 text-primary">
                                {@html placeholder1}
                            </span>
                            <span class="fw-bold d-block display-1 rolling-text-2">
                                {@html placeholder2}
                            </span>
                            <span class="fw-bold {text_color} display-5" style="opacity:0.7;">
                                {@html placeholder3}
                            </span>
                        </div>
                    {/if}
                    
                    <!-- Animated content (positioned absolutely over placeholders) -->
                    <div class="animated-content">
                        <!-- All titles with same transition type for consistency -->
                        <span
                            in:fade={{ duration: 300 }}
                            class="fw-bold d-block display-3 text-primary"
                        >
                            {@html rollingText1}
                        </span>
                        
                        <span
                            in:fade={{ duration: 300 }}
                            class="fw-bold d-block display-1 rolling-text-2"
                        >
                            {@html rollingText2}
                        </span>
                        
                        <span
                            in:fade={{ duration: 300 }}
                            class="fw-bold {text_color} display-5"
                            style="opacity:0.7;"
                        >
                            {@html rollingText3}
                        </span>
                    </div>
                </div>
            {/if}
        </Saos>
        <!-- Left Section -->

        <!-- Right Section -->
        <div class="col-md-6 mb-3" />
        <!-- Right Section -->
    </div>
</div>

<!-- Header component -->

<style>
    .rolling-text {
        display: inline-block;
        overflow: hidden;
        white-space: nowrap;
    }
    
    :global(.text-shadows) {
        position: relative;
        color: var(--color-1);
        font-weight: bold;
        text-shadow:
            1px 1px 0 var(--color-2),
            2px 2px 0 var(--color-3),
            3px 3px 0 var(--color-4),
            4px 4px 0 var(--color-5),
            5px 5px 0 var(--color-6),
            6px 6px 0 var(--color-7),
            7px 7px 0 var(--color-8),
            8px 8px 0 var(--color-9),
            9px 9px 0 var(--color-10);
        transition: all 2s ease-in-out;
        animation: textShadowTransition 2s ease-in-out forwards;
    }
    
    @keyframes textShadowTransition {
        0% {
            text-shadow: none;
            transform: scale(1) translateY(0);
        }
        100% {
            text-shadow:
                1px 1px 0 var(--color-2),
                2px 2px 0 var(--color-3),
                3px 3px 0 var(--color-4),
                4px 4px 0 var(--color-5),
                5px 5px 0 var(--color-6),
                6px 6px 0 var(--color-7),
                7px 7px 0 var(--color-8),
                8px 8px 0 var(--color-9),
                9px 9px 0 var(--color-10);
            transform: scale(1.2) translateY(-10px);
        }
    }
    
    :global(.text-shadows::after) {
        content: attr(data-text);
        position: absolute;
        top: 0;
        left: 0;
        color: #000;
        z-index: -1;
        transform: translate(5px, 5px);
        filter: blur(1px);
        opacity: 0.5;
        transition: transform 2s ease-in-out, filter 2s ease-in-out, opacity 2s ease-in-out;
    }

    .header-container {
        position: relative;
    }
    
    .layout-placeholders {
        visibility: hidden;
        pointer-events: none;
    }
    
    .animated-content {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
    }
</style>
