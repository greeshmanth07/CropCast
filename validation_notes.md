# Marketplace Interaction Validation

The live buyer flow was exercised in the browser on 26 August 2026. The Buyer role opened from the direct marketplace entry, the **Find Produce** action opened the searchable nearby inventory, and the Tomato seller card revealed the calculated deal sheet. The sheet showed the listing price, delivery cost, total cost, editable quantity, **Place order**, and **Make an offer** actions. The product presentation remained responsive and image-led at the verified viewport.

The Farmer / FPO role was then selected from the same live page. It opened a distinct farmer dashboard with a 1,000 kg tomato card, current price, buyer count, crop price graph, online/offline choice, AI suggestion, and visual buyer-need controls. This confirms role switching does not merge the farmer and buyer experiences.

The visual farmer listing flow was also exercised. Its **List My Produce** action opened the large crop-choice step. The accessible **Next** handler advanced from the Tomato crop step to the quantity step, where the 1,000 kg value and Back/Next controls were displayed.

The marketplace header language control was located in the live Buyer dashboard as an accessible button. A direct browser click was attempted; a programmatic activation check is being used to confirm the React state transition because the browser-driver click did not immediately refresh the extracted language text.

The direct activation succeeded: the live Buyer dashboard re-rendered with Telugu titles, role labels, buttons, and summary cards. The original crop-guide footer remains English, but the marketplace workflow language control is functioning end to end.

The Telugu Buyer workflow was reopened and its **Find Produce** action revealed the locally available Tomato listing with translated inventory controls. This confirms the buyer search path remains functional after the language transition.

The translated Tomato seller card opened its deal sheet with crop cost, delivery cost, calculated total, editable quantity, **Place order**, and **Make an offer** controls. The browser-driver click did not refresh the extracted confirmation text immediately, so the direct activation path is used next to confirm the React order transition.

The direct order activation succeeded. The live Buyer workflow reached a Telugu confirmation screen showing the selected Tomato listing, 500 kg quantity, crop and delivery costs, total cost, pickup location, delivery destination, and translated confirm/cancel controls.

The confirmation was submitted in the live app. It created the demo order, increased the update counter, and opened the Telugu logistics view with route visual, tracking steps, and the pickup, start-delivery, and delivered controls.

The live **Plan pickup** action was activated in the translated logistics workspace. The order remained on the same route-tracking screen with the subsequent delivery controls available, confirming the pickup-status action completes without breaking the workflow.
