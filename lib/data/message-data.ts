export const messageData = [
  {
    id: 1,
    title: "Welcome Message",
    description: "Introduction message for new stores",
    content: `Thank you for your time today. We’re excited to launch still good with you! 

Could you please add the following managers to the group: 
•⁠  ⁠Store manager 
•⁠  ⁠⁠Assistant manager 
•⁠  ⁠⁠Bakery manager 
•⁠  ⁠Produce manager 
•⁠  ⁠Receiving manager 

I have added our operations team as well as our marketing team to align marketing and Ops for the launch. 

Have a great day’s trade, 
Kind regards 
` ,
    subcategory: "Introduction" as const,
  },
  {
    id: 2,
    title: "Store Instructions",
    description: "Dynamic instructions based on store configuration",
    content: "This message will be dynamically generated based on the selected store.",
    subcategory: "Packing" as const,
  },
  {
    id: 3,
    title: "Quality Control Guidelines",
    description: "Guidelines for ensuring product quality",
    content: `Quality Control Guidelines

When packing bags, please ensure:

✅ All items are within their use-by date
✅ Packaging is intact and undamaged
✅ Fresh produce is in good condition
✅ Items are clean and presentable
✅ Variety is maintained across bags

Remember: Quality is our top priority. When in doubt, leave it out!`,
    subcategory: "Packing" as const,
  },
  //   {
  //     id: 4,
  //     title: "Collection Process",
  //     description: "How the collection process works",
  //     content: `Collection Process

  // Here's what to expect during collection times:

  // 1. Bags should be ready 30 minutes before collection window
  // 2. Keep bags in a cool, designated area
  // 3. Our driver will arrive during the specified time window
  // 4. Please have someone available to hand over the bags

  // If there are any issues, please contact us immediately.`,
  //     subcategory: "Collection" as const,
  //   },
]
