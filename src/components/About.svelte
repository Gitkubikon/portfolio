<script>
    import { slide, fade } from "svelte/transition";
    import { onMount } from "svelte";
    import Saos from "saos";

    let ready = false;
    onMount(() => (ready = true));

    // Section Id
    export let Id;
    // Title of skills area
    export let skills_title;
    // Skills
    export let skills;
    // Title of bio area
    export let bio_title;
    // Bio description
    export let bio;
    // theme toggle
    export let state;

    let text_color = "dark";
    let bg_color = "light";

    if (state == "dark") {
        text_color = "light";
        bg_color = "dark";
    }

    let showAbout = true;

    function toggleSection() {
        showAbout = !showAbout;
    }
</script>

<!-- About component -->
<div
    class="bg-{bg_color} text-{text_color} d-flex justify-content-center align-items-center min-vh-100"
    id={Id}
    style="padding-top:58px; background-color: transparent !important;"
>
    <Saos animation={""}>
        {#if ready}
            <div class="container text-center">
                {#if showAbout}
                    <!-- About Section -->
                    <div class="row">
                        <div in:fade={{ duration: 1000 }} class="col-12 mb-3">
                            <!-- Section title -->
                            <h1 class="fw-bold text-primary mb-5">
                                {bio_title}
                                <button class="custom-button mb-4" on:click={toggleSection}>
                                    {showAbout ? "View Skills" : "View About Me"}
                                </button>
                            </h1>
                            <!-- Section title -->

                            <hr class="mb-5" />

                            <!-- Section Data -->
                            <p
                                in:fade={{ delay: 500, duration: 1000 }}
                                class=""
                            >
                                {bio}
                            </p>
                            <!-- Section Data -->
                        </div>
                    </div>
                    <!-- About Section -->
                {:else}
                    <!-- Skills Section -->
                    <div class="row">
                        <div in:fade={{ duration: 1000 }} class="col-12">
                            <!-- Section title -->
                            <h1 class="fw-bold text-primary mb-5">
                                {skills_title}
                                <button class="custom-button mb-4" on:click={toggleSection}>
                                    {showAbout ? "View Skills" : "View About Me"}
                                </button>
                            </h1>
                            <!-- Section title -->

                            <hr class="mb-5" />

                            <!-- Section Data -->
                            <div
                                in:fade={{ delay: 1000, duration: 1000 }}
                                class="row"
                            >
                                {#each Object.entries(skills) as [category, skillsArray]}
                                    <div class="col-12 col-md-6 col-lg-4 mb-4">
                                        <h3 class="text-secondary">
                                            {category}
                                        </h3>
                                        {#each skillsArray as skill}
                                            <p class="fw-bold">
                                                <i class={skill[1]} />
                                                {skill[0]}
                                            </p>
                                            <div
                                                class="progress progress-bar-striped progress-bar-animated bg-{bg_color} mb-3"
                                            >
                                                <div
                                                    class="progress-bar bg-primary animate"
                                                    role="progressbar"
                                                    style="--size:{skill[2]}%"
                                                    aria-valuenow={skill[2]}
                                                    aria-valuemin="0"
                                                    aria-valuemax="100"
                                                />
                                            </div>
                                        {/each}
                                    </div>
                                {/each}
                            </div>
                            <!-- Section Data -->
                        </div>
                    </div>
                    <!-- Skills Section -->
                {/if}
            </div>
        {/if}
    </Saos>
</div>

<!-- About component -->
<style>
    .animate {
        animation: animate 4s both;
    }

    @keyframes animate {
        0% {
            width: 0;
        }
        100% {
            width: var(--size);
        }
    }

    .progress-bar {
        height: 1rem;
    }

    .progress {
        background-color: var(--dark) !important;
    }

    @media (max-width: 768px) {
        .col-12.col-md-6.col-lg-4.mb-4 {
            margin-bottom: 2rem;
        }
    }

    .text-secondary {
        color: var(--color-10) !important;
        margin-bottom: 20px;
    }

    .custom-button {
        background-color: transparent;
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
        transition:
            background-color 0.3s ease,
            transform 0.3s ease;
        border-radius: 0.5rem;
        color: var(--primary-color);
        transition:
            transform 0.3s ease,
            color 0.3s ease;
        border-radius: 8px;
        border: 2px solid var(--primary-color);
        position: relative;
        top: -8px;
        left: 10px;
    }

    .custom-button:hover {
        transform: scale(1.05);
    }

    .custom-button:active {
        transform: scale(1);
    }
</style>
