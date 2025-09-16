const imageUpload = document.getElementById('imageUpload');
const originalImage = document.getElementById('originalImage');
const originalPlaceholder = document.getElementById('originalPlaceholder');
const generatedImage = document.getElementById('generatedImage');
const generatedImageContainer = document.getElementById('generatedImageContainer');
const generatedPlaceholder = document.getElementById('generatedPlaceholder');
const apiKeyInput = document.getElementById('apiKey');
const saveApiKeyButton = document.getElementById('saveApiKeyButton');
const promptTextarea = document.getElementById('prompt');
const generateButton = document.getElementById('generateButton');
const loader = document.getElementById('loader');
const errorMessage = document.getElementById('errorMessage');
const helpButton = document.getElementById('helpButton');
const helpModal = document.getElementById('helpModal');
const closeModalButton = document.getElementById('closeModalButton');
const settingsButton = document.getElementById('settingsButton');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsModalButton = document.getElementById('closeSettingsModalButton');
const supportButton = document.getElementById('supportButton');
const supportModal = document.getElementById('supportModal');
const closeSupportModalButton = document.getElementById('closeSupportModalButton');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const imageModal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const closeImageModalButton = document.getElementById('closeImageModalButton');
const downloadButton = document.getElementById('downloadButton');
const bgmAudio = document.getElementById('bgmAudio');
const muteButton = document.getElementById('muteButton');

let base64ImageData = null;
let imageMimeType = null;

const presetPrompts = {
    figure_realistic: 'photorealistic, masterpiece, hyperrealistic, ultra-detailed, 1/7 scale figure, high-quality collectible PVC figure, intricate details, professional studio lighting, soft shadows, detailed paint job, DSLR photo',
    figure_nendoroid: 'chibi, nendoroid style figure, cute, small and adorable, smooth plastic texture, studio lighting, plain background',
    anime_modern: 'masterpiece, best quality, modern anime screenshot, key visual, cinematic lighting, beautiful detailed eyes, vibrant colors, from a critically acclaimed anime',
    anime_90s: '90s anime style, retro anime, cel animation, film grain, masterpiece, nostalgic, saturated colors',
    realistic: 'masterpiece, best quality, ultra-realistic photo, photorealistic, 8k, RAW photo, detailed skin texture, cinematic lighting, professional photography',
    illustration: 'digital illustration, masterpiece, beautifully detailed, vibrant colors, fantasy, intricate, elegant, sharp focus, artstation',
    pixel_art: 'pixel art, 16-bit, retro video game style, vibrant color palette, detailed sprite',
    cyberpunk: 'cyberpunk style, neon lights, futuristic city, chrome details, holographic elements, cinematic lighting, techwear fashion',
    watercolor: 'watercolor painting, beautiful, soft colors, paper texture, wet on wet technique, artistic'
};

window.setPrompt = (style) => promptTextarea.value = presetPrompts[style];

const showToast = (message) => {
    toastMessage.textContent = message;
    toast.classList.remove('opacity-0', 'translate-y-5');
    toast.classList.add('opacity-100', 'translate-y-0');
    setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', 'translate-y-5');
    }, 3000);
};

saveApiKeyButton.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
        localStorage.setItem('geminiApiKey', apiKey);
        showToast('APIキーを保存しました。');
    } else {
        displayMessage('APIキーを入力してください。', true);
    }
});

const loadApiKey = () => {
    const savedKey = localStorage.getItem('geminiApiKey');
    if (savedKey) {
        apiKeyInput.value = savedKey;
    }
};

imageUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) { return; }
    const reader = new FileReader();
    reader.onload = (e) => {
        originalImage.src = e.target.result;
        originalImage.classList.remove('hidden');
        originalPlaceholder.classList.add('hidden');
        const [header, data] = e.target.result.split(',');
        const mimeMatch = header.match(/:(.*?);/);
        imageMimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        base64ImageData = data;
    };
    reader.readAsDataURL(file);
});

generateButton.addEventListener('click', () => {
    if (!apiKeyInput.value.trim()) {
        return displayMessage('APIキーを入力・保存してください。', true);
    }
    if (!base64ImageData) {
        return displayMessage('最初に画像をアップロードしてください。', true);
    }
    if (!promptTextarea.value.trim()) {
        return displayMessage('プロンプトを入力してください。', true);
    }
    generateImage();
});

const displayMessage = (message, isError = false) => {
    errorMessage.textContent = message;
    errorMessage.className = `mt-4 text-sm text-center h-5 font-semibold ${isError ? 'text-red-600 bg-red-100 rounded-md px-2 py-1' : 'text-green-600'}`;
};

helpButton.addEventListener('click', () => helpModal.classList.replace('hidden', 'flex'));
closeModalButton.addEventListener('click', () => helpModal.classList.replace('flex', 'hidden'));
helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) helpModal.classList.replace('flex', 'hidden');
});

settingsButton.addEventListener('click', () => settingsModal.classList.replace('hidden', 'flex'));
closeSettingsModalButton.addEventListener('click', () => settingsModal.classList.replace('flex', 'hidden'));
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.classList.replace('flex', 'hidden');
});

supportButton.addEventListener('click', () => supportModal.classList.replace('hidden', 'flex'));
closeSupportModalButton.addEventListener('click', () => supportModal.classList.replace('flex', 'hidden'));
supportModal.addEventListener('click', (e) => {
    if (e.target === supportModal) supportModal.classList.replace('flex', 'hidden');
});

generatedImageContainer.addEventListener('click', () => {
    if (!generatedImage.classList.contains('hidden')) {
        modalImage.src = generatedImage.src;
        imageModal.classList.replace('hidden', 'flex');
    }
});
closeImageModalButton.addEventListener('click', () => imageModal.classList.replace('flex', 'hidden'));
imageModal.addEventListener('click', (e) => {
    if (e.target === imageModal) imageModal.classList.replace('flex', 'hidden');
});

const handleApiError = async (response) => {
    let errorMsg = `APIエラーが発生しました (ステータス: ${response.status})。`;
    try {
        const errorData = await response.json();
        console.error('API Error Details:', errorData);
        const detail = errorData.error?.message || '';
        if (response.status === 400) {
            errorMsg = 'APIキーが無効か、リクエストが正しくありません。キーや権限を確認してください。';
        } else if (response.status === 403) {
            errorMsg = 'APIキーの権限がありません。';
        } else if (response.status === 500) {
            errorMsg = 'Googleのサーバー側で問題が発生しました。時間をおいてお試しください。';
        }
        if (detail) {
            errorMsg += ` 詳細: ${detail}`;
        }
    } catch (e) {
        console.error("Could not parse error response:", e);
    }
    throw new Error(errorMsg);
};

async function generateImage() {
    displayMessage('', false);
    loader.classList.remove('hidden');
    generateButton.disabled = true;
    generateButton.textContent = '生成中...';
    generatedImage.classList.add('hidden');
    generatedPlaceholder.classList.remove('hidden');
    downloadButton.classList.add('hidden');
    downloadButton.classList.remove('inline-block');

    const apiKey = apiKeyInput.value.trim();
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: promptTextarea.value }, { inlineData: { mimeType: imageMimeType, data: base64ImageData }}] }],
        generationConfig: { responseModalities: ['IMAGE'] },
    };
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            await handleApiError(response);
        }

        const result = await response.json();
        const base64Data = result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;

        if (base64Data) {
            const imageUrl = `data:image/png;base64,${base64Data}`;
            generatedImage.src = imageUrl;
            downloadButton.href = imageUrl;
            
            generatedImage.classList.remove('hidden');
            generatedPlaceholder.classList.add('hidden');
            downloadButton.classList.remove('hidden');
            downloadButton.classList.add('inline-block');
            
            displayMessage('生成が完了しました！', false);
        } else {
            console.error('Unexpected response structure:', result);
            throw new Error('生成された画像データが見つかりません。レスポンスを確認してください。');
        }
    } catch (error) {
        console.error(`Generation failed:`, error);
        displayMessage(error.message, true);
    } finally {
        loader.classList.add('hidden');
        generateButton.disabled = false;
        generateButton.textContent = '生成する';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadApiKey();

    // --- BGM Logic ---
    let isMutedByPolicy = false;
    
    // 重要：このHTMLファイルと同じフォルダにBGMファイルを置いてください
    bgmAudio.src = 'Ievan Polkka-初音ミクver - tyoge.mp3';

    const toggleMute = () => {
        const isNowMuted = !bgmAudio.muted;
        bgmAudio.muted = isNowMuted;
        muteButton.textContent = isNowMuted ? '🔇' : '🔊';
        if (!isNowMuted) {
            isMutedByPolicy = false;
        }
    };

    muteButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMute();
    });

    const playPromise = bgmAudio.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            // Autoplay with sound started successfully.
            muteButton.textContent = '🔊';
        }).catch(error => {
            // Autoplay was prevented.
            console.log('Autoplay with sound was blocked. Starting muted.');
            isMutedByPolicy = true;
            bgmAudio.muted = true;
            muteButton.textContent = '🔇';
            bgmAudio.play();
        });
    }

    const unmuteOnFirstInteraction = () => {
        if (isMutedByPolicy) {
            bgmAudio.muted = false;
            muteButton.textContent = '🔊';
            isMutedByPolicy = false;
        }
        // Remove the listeners after the first interaction.
        window.removeEventListener('click', unmuteOnFirstInteraction);
        window.removeEventListener('touchend', unmuteOnFirstInteraction);
    };

    window.addEventListener('click', unmuteOnFirstInteraction);
    window.addEventListener('touchend', unmuteOnFirstInteraction);

});
