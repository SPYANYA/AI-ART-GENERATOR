// Replace with your valid Hugging Face token
const token = "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"; 

// DOM Elements
const inputTxt = document.getElementById("input");
const image = document.getElementById("image");
const button = document.getElementById("btn");

// Function to query the API with retry logic
async function query(prompt, retries = 5) {
    image.src = "loading.gif";
    image.style.display = "block";

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            console.log(`Attempt ${attempt + 1}: Sending request...`);
            const response = await fetch(
                "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1",
                {
                    headers: { Authorization: `Bearer ${token}` },
                    method: "POST",
                    body: JSON.stringify({ inputs: prompt }),
                }
            );

            if (response.status === 503) {
                console.warn(`Model loading: Attempt ${attempt + 1} of ${retries}`);
                if (attempt < retries - 1) {
                    await new Promise((resolve) => setTimeout(resolve, 60000)); // Wait 1 minute
                    continue;
                } else {
                    throw new Error("Model is still loading. Please try again later.");
                }
            }

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Error response:", errorData);
                throw new Error(errorData.error || "Failed to generate image.");
            }

            console.log("Image generated successfully.");
            return await response.blob();
        } catch (error) {
            console.error(`Attempt ${attempt + 1} failed: ${error.message}`);
            if (attempt === retries - 1) {
                throw error;
            }
        }
    }
}

// Event listener for button click
button.addEventListener("click", async function () {
    const prompt = inputTxt.value.trim(); // Get user input
    if (!prompt) {
        alert("Please enter a prompt!"); // Validate input
        return;
    }

    try {
        console.log("Button clicked. Generating image...");
        button.innerHTML = "<span class='text'>Generating...</span>"; // Show loading state
        const refinedPrompt = `${prompt}, realistic, 4K, ultra-detailed, professional photography`;
        const responseBlob = await query(refinedPrompt);

        // Replace loading GIF with the generated image
        const objectURL = URL.createObjectURL(responseBlob);
        image.src = objectURL;
    } catch (error) {
        const errorMsg = error.message || "An unknown error occurred.";
        console.error("Error:", errorMsg);
        alert(`Error: ${errorMsg}`);
        image.src = "error-placeholder.webp"; // Fallback error image
    } finally {
        button.innerHTML = "<span class='text'>Generate</span>"; // Reset button text
    }
});
