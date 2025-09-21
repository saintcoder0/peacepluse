import asyncio
from playwright import async_api

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:8080", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # Verify wellness metrics for mood, habits, and sleep are accurately displayed on the Dashboard.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/nav/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click on the Mood Tracker summary card or button to verify navigation and data display.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/nav/div/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click on the Sleep Tracker button to verify navigation and data display.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/nav/div/button[4]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Input valid bedtime and wake-up time, select a sleep quality, and attempt to save the sleep entry.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/main/div/div[2]/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('22:30')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/main/div/div[2]/div/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('06:30')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/main/div/div[2]/div[3]/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click the 'Save Sleep Entry' button to save the new sleep log and verify the entry is recorded in Sleep History.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/main/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click on the Habits button to navigate to the Habit Tracker page and verify navigation and data display.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/nav/div/button[5]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click on the Journal button to navigate to the Journal page and verify navigation and data display.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/nav/div/button[6]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Input text into the Quick Entry textarea and optional Title input, then click Save to create a new journal entry.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/main/div/div[3]/textarea').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Today I felt productive and grateful for the support around me.')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/main/div/div[3]/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Gratitude Reflection')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/main/div/div[3]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click the Save Entry button to save the journal entry and verify it appears in Recent Entries.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/main/div/div[2]/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click on the Chat button to navigate to the ChatBot page and begin comprehensive testing of the ChatBot features.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/nav/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Send a message in the chat input to test AI response and mood analysis.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/main/div/div[2]/div[3]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('I am feeling stressed today.')
        

        # Click each Quick Topic button ('I'm feeling anxious', 'Help with sleep', 'Stress management', 'Daily motivation') to verify they send appropriate messages and receive correct AI responses.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/main/div/div[3]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click the 'Help with sleep' quick topic button to verify it auto-fills the input field and sends the appropriate message.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/main/div/div[3]/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click the 'Stress management' quick topic button to verify it auto-fills the input field and sends the appropriate message.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/main/div/div[3]/div/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Assertions for wellness metrics on Dashboard overview
        frame = context.pages[-1]
        mood_metric = await frame.locator('xpath=//div[contains(text(),"Mood") or contains(@class,"mood-metric")]').text_content()
        habits_metric = await frame.locator('xpath=//div[contains(text(),"Habits") or contains(@class,"habits-metric")]').text_content()
        sleep_metric = await frame.locator('xpath=//div[contains(text(),"Sleep") or contains(@class,"sleep-metric")]').text_content()
        assert mood_metric is not None and mood_metric.strip() != '', 'Mood metric should be displayed and not empty'
        assert habits_metric is not None and habits_metric.strip() != '', 'Habits metric should be displayed and not empty'
        assert sleep_metric is not None and sleep_metric.strip() != '', 'Sleep metric should be displayed and not empty'
        
# Assertions for navigation to core features and data display
        # Mood Tracker page check
        assert 'Mood' in await frame.title() or 'Mood Tracker' in await frame.title(), 'Should be on Mood Tracker page'
        
# Sleep Tracker page check
        assert 'Sleep' in await frame.title() or 'Sleep Tracker' in await frame.title(), 'Should be on Sleep Tracker page'
        
# Habit Tracker page check
        assert 'Habit' in await frame.title() or 'Habit Tracker' in await frame.title(), 'Should be on Habit Tracker page'
        
# Journal page check
        assert 'Journal' in await frame.title() or 'Entries' in await frame.title(), 'Should be on Journal page'
        
# ChatBot page check
        assert 'Chat' in await frame.title() or 'ChatBot' in await frame.title(), 'Should be on ChatBot page'
        
# Assertions for ChatBot component
        # Check wellness assistant status and greeting
        assistant_status = await frame.locator('xpath=//div[contains(text(),"Online") or contains(@class,"assistant-status")]').text_content()
        assistant_greeting = await frame.locator('xpath=//div[contains(text(),"Hello!") or contains(@class,"assistant-greeting")]').text_content()
        assert assistant_status == 'Online', 'Assistant should be online'
        assert assistant_greeting.startswith("Hello!"), 'Assistant greeting should be present'
        
# Check quick topics buttons presence
        for topic in ["I'm feeling anxious", "Help with sleep", "Stress management", "Daily motivation"]:
            button = frame.locator(f'xpath=//button[contains(text(),"{topic}")]')
            assert await button.count() > 0, f'Quick topic button "{topic}" should be present'
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    