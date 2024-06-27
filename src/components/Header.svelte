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

    function startRollingTextAnimation() {
        interval1 = createRollingInterval(
            preprocessText(header_title_1),
            setRollingText1,
        );
        interval2 = createRollingInterval(
            preprocessText(header_title_2),
            setRollingText2,
            500,
        );

        if (Array.isArray(header_title_3)) {
            startCarousel(header_title_3, setRollingText3, 1000);
        } else {
            interval3 = createRollingInterval(
                preprocessText(header_title_3),
                setRollingText3,
                1000,
            );
        }
    }

    function createRollingInterval(text, setter, delay = 0) {
        let index = 0;
        let currentText = "";
        const plainText = text.replace(/<[^>]+>/g, ""); // Remove HTML tags for rolling logic
        const tags = text.match(/<[^>]+>/g) || [];
        let tagIndex = 0;
        return setTimeout(() => {
            const interval = setInterval(() => {
                if (index < plainText.length) {
                    const targetChar = plainText[index];
                    const randomChar =
                        randomChars[
                            Math.floor(Math.random() * randomChars.length)
                        ];
                    currentText = plainText.slice(0, index) + randomChar;
                    if (
                        tags[tagIndex] &&
                        currentText.length >=
                            plainText.indexOf(
                                tags[tagIndex].replace(/<[^>]+>/g, ""),
                            )
                    ) {
                        currentText += tags[tagIndex];
                        tagIndex++;
                    }
                    setter(currentText);
                    if (
                        Math.random() < 0.3 ||
                        currentText.length >= index + 10
                    ) {
                        currentText = plainText.slice(0, index + 1);
                        if (
                            tags[tagIndex] &&
                            currentText.length >=
                                plainText.indexOf(
                                    tags[tagIndex].replace(/<[^>]+>/g, ""),
                                )
                        ) {
                            currentText += tags[tagIndex];
                            tagIndex++;
                        }
                        setter(currentText);
                        index++;
                        if (index === plainText.length) {
                            clearInterval(interval);
                            setter(text); // Set final HTML text with 3D effect
                        }
                    }
                } else {
                    setter(text); // Set final HTML text with 3D effect
                    clearInterval(interval);
                }
            }, 50); // More consistent scrolling with 50ms interval
            return interval;
        }, delay);
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

    onMount(() => {
        startRollingTextAnimation();
        return () => {
            clearInterval(interval1);
            clearInterval(interval2);
            clearInterval(interval3);
            clearInterval(carouselInterval);
        };
    });
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
                <div class="col-md-6 mb-3 text-uppercase">
                    <!-- Rolling Title 1 -->
                    <span
                        in:fade={{ duration: 500 }}
                        class="fw-bold d-block display-3 text-primary"
                    >
                        {@html rollingText1}
                    </span>
                    <!-- Rolling Title 1 -->

                    <!-- Rolling Title 2 -->
                    <span
                        in:slide={{ delay: 250, duration: 500 }}
                        class="fw-bold d-block display-1 rolling-text-2"
                    >
                        {@html rollingText2}
                    </span>
                    <!-- Rolling Title 2 -->

                    <!-- Rolling Title 3 -->
                    <span
                        in:fade={{ delay: 100, duration: 500 }}
                        class="fw-bold {text_color} display-5"
                        style="opacity:0.7;"
                    >
                        {@html rollingText3}
                    </span>
                    <!-- Rolling Title 3 -->
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
</style>
