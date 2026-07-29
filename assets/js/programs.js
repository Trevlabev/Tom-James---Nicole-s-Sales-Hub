window.NAH_PROGRAMS = [
  {
    "slug": "alteration-intake-builder",
    "title": "Alteration Intake Builder",
    "glyph": "AI",
    "category": "Alterations",
    "priority": "Build first",
    "status": "Ready to vibe code",
    "summary": "Creates a complete, standardized alteration intake record before a garment leaves the office.",
    "why": "Alteration requests can arrive by email, Trello, photographs, pinned notes, or direct instruction. This tool prevents missing COFs, unclear garment identity, incomplete directions, and untracked custody.",
    "inputs": [
      "Client and Sales Professional",
      "Order, COF, item or line ID",
      "Garment, cloth, and quantity",
      "Exact instructions and photographs",
      "Provider, client-required date, and physical location"
    ],
    "outputs": [
      "Clean alteration summary",
      "Trello-ready card text",
      "Excel-ready row",
      "Photo/ticket checklist",
      "Provider handoff sheet"
    ],
    "roadmap": [
      "Guided intake form with required-field validation",
      "Garment-specific instruction sections",
      "Photo checklist and filename generator",
      "Export to PDF, JSON, CSV, and copy-ready Trello text"
    ],
    "security": "Client data should remain in an approved internal system. The GitHub Pages portal should launch or embed the secured tool rather than store records itself.",
    "embedUrl": "",
    "launchUrl": ""
  },
  {
    "slug": "alteration-photo-packager",
    "title": "Alteration Photo Packager",
    "glyph": "AP",
    "category": "Alterations",
    "priority": "High value",
    "status": "Placeholder",
    "summary": "Organizes garment photographs, written notes, and labels into a consistent alteration evidence packet.",
    "why": "Alteration photographs frequently carry the actual instructions. Similar garments and incomplete image sets create avoidable errors.",
    "inputs": [
      "Client and COF",
      "Garment identity",
      "Whole-garment photos",
      "Close-ups of written or pinned instructions",
      "Order-label image"
    ],
    "outputs": [
      "Renamed image package",
      "Printable photo contact sheet",
      "Photo sequence checklist",
      "Attachment manifest"
    ],
    "roadmap": [
      "Drag-and-drop image ordering",
      "Automatic filename scheme",
      "Printable contact-sheet generator",
      "Missing-photo warnings"
    ],
    "security": "Do not publish client-identifying garment photographs in a public repository.",
    "embedUrl": "",
    "launchUrl": ""
  },
  {
    "slug": "alteration-command-center",
    "title": "Alteration Command Center",
    "glyph": "AC",
    "category": "Alterations",
    "priority": "Build first",
    "status": "Ready to vibe code",
    "summary": "A focused control surface for every active local, factory, cleaner, repair, and completed alteration.",
    "why": "Alterations require control of provider custody, transfer dates, ETCs, reported completion, physical return, client scheduling, and measurement follow-up.",
    "inputs": [
      "Active alteration export or manual entries",
      "Provider and physical location",
      "Transfer date and ETC",
      "Client-required date",
      "Status and next follow-up"
    ],
    "outputs": [
      "Due-soon and overdue queue",
      "Needs-date list",
      "Reported-complete-but-not-returned list",
      "Completed-awaiting-scheduling list",
      "Daily provider follow-up list"
    ],
    "roadmap": [
      "Status board and filtered queues",
      "Aging and deadline calculations",
      "Provider-specific views",
      "Trello/Excel import and export"
    ],
    "security": "Use authenticated storage for real client records. A public static page is suitable only for the interface shell or demo data.",
    "embedUrl": "",
    "launchUrl": ""
  },
  {
    "slug": "factory-return-helper",
    "title": "Factory Return Helper",
    "glyph": "FR",
    "category": "Alterations",
    "priority": "Build first",
    "status": "Ready to vibe code",
    "summary": "Walks the assistant through Check-in, Return, instruction entry, printing, staging, and next-business-day verification.",
    "why": "Factory returns involve multiple screens, garment-specific rules, short instruction fields, return numbers, and physical staging by destination.",
    "inputs": [
      "Factory and garment type",
      "Client/order/COF",
      "Return type and approved reason",
      "Alteration directions",
      "Destination and tracking"
    ],
    "outputs": [
      "Step-by-step checklist",
      "Character-counted instructions",
      "Approved abbreviation suggestions",
      "Return verification reminder",
      "Factory-status inquiry summary"
    ],
    "roadmap": [
      "Factory-specific flow branching",
      "50-character instruction validator",
      "Abbreviation library",
      "Printable staging label and follow-up record"
    ],
    "security": "Never embed Secure Site credentials or automate sign-in from a public static site.",
    "embedUrl": "",
    "launchUrl": ""
  },
  {
    "slug": "inventory-receipt-reconciler",
    "title": "Inventory Receipt & Reconciler",
    "glyph": "IR",
    "category": "Inventory & Orders",
    "priority": "Build first",
    "status": "Ready to vibe code",
    "summary": "Matches packing-list items to garments, client records, Trello, Excel, and physical rack locations.",
    "why": "Daily shipments can contain new orders, completed alterations, returns, fabrics, and office inventory. A single box can represent multiple workflows.",
    "inputs": [
      "Packing-list lines",
      "Physical item count",
      "Client, Sales Professional, order, and COF",
      "Damage or discrepancy notes",
      "Assigned physical location"
    ],
    "outputs": [
      "Received-item checklist",
      "Missing/extra/damaged exception list",
      "Trello/Excel update package",
      "Rack and shelf placement list"
    ],
    "roadmap": [
      "CSV and manual packing-list entry",
      "Item-by-item reconciliation",
      "Completeness status",
      "Printable discrepancy report"
    ],
    "security": "Avoid uploading client packing lists to third-party services unless they are approved for company data.",
    "embedUrl": "",
    "launchUrl": ""
  },
  {
    "slug": "wip-watch-review",
    "title": "WIP & Watch Review Assistant",
    "glyph": "WW",
    "category": "Inventory & Orders",
    "priority": "Build first",
    "status": "Ready to vibe code",
    "summary": "Turns WIP and Watch List reviews into a repeatable investigation and escalation workflow.",
    "why": "The assistant repeatedly checks production milestones, held orders, cloth or lining delays, back orders, late shipments, and client deadlines.",
    "inputs": [
      "WIP milestone data",
      "Watch List or delayed-order export",
      "Client-required date",
      "Current Trello/Excel status",
      "Factory response"
    ],
    "outputs": [
      "Critical and high-priority queue",
      "Stalled-stage detection",
      "Factory follow-up list",
      "Nicole decision brief",
      "Reconciliation exceptions"
    ],
    "roadmap": [
      "Import Watch List exports",
      "Milestone aging rules",
      "Client-deadline comparison",
      "One-click escalation brief"
    ],
    "security": "Use demo data on public Pages. Real exports should be processed in a secured embedded application.",
    "embedUrl": "",
    "launchUrl": ""
  },
  {
    "slug": "rush-deadline-monitor",
    "title": "Rush & Deadline Monitor",
    "glyph": "RD",
    "category": "Inventory & Orders",
    "priority": "High value",
    "status": "Placeholder",
    "summary": "Separates standard due dates, rush commitments, client-required dates, fittings, and event deadlines.",
    "why": "A production due date is not always the same as the date needed to protect the client commitment.",
    "inputs": [
      "Order and garment",
      "Standard due date",
      "Rush date",
      "Client-required or event date",
      "Current stage and confidence"
    ],
    "outputs": [
      "Deadline risk score",
      "Follow-up calendar",
      "Needs-date queue",
      "At-risk client commitments"
    ],
    "roadmap": [
      "Date model and risk rules",
      "Calendar export",
      "Visual timeline",
      "Deadline-change audit history"
    ],
    "security": "Do not expose client names or event details on a public deployment.",
    "embedUrl": "",
    "launchUrl": ""
  },
  {
    "slug": "shipment-delivery-desk",
    "title": "Shipment & Delivery Desk",
    "glyph": "SD",
    "category": "Logistics",
    "priority": "High value",
    "status": "Placeholder",
    "summary": "Enforces the two-part rule: a digital request and the correctly staged physical garment must both exist.",
    "why": "Shipping failures occur when the digital request, address, garment contents, physical rack, tracking, and delivery confirmation fall out of sync.",
    "inputs": [
      "Recipient and verified address",
      "Contents and garment count",
      "Service level and ship-by date",
      "Physical staging location",
      "Carrier and tracking"
    ],
    "outputs": [
      "Shipping request sheet",
      "Packing checklist",
      "Tracking status record",
      "Delivery exception brief"
    ],
    "roadmap": [
      "Request builder",
      "Physical-stage confirmation",
      "Carrier-link generation",
      "Delivered/exception workflow"
    ],
    "security": "Addresses and tracking data should be stored only in approved systems.",
    "embedUrl": "",
    "launchUrl": ""
  },
  {
    "slug": "daily-operations-planner",
    "title": "Daily Operations Planner",
    "glyph": "DP",
    "category": "Daily Control",
    "priority": "Build first",
    "status": "Ready to vibe code",
    "summary": "Creates a realistic day plan from the calendar, Critical items, shipments, alterations, deliveries, and closing requirements.",
    "why": "The role has a recurring Monday\u2013Friday cadence but urgent client and garment work must override a rigid schedule.",
    "inputs": [
      "Day of week",
      "Calendar commitments",
      "Critical and High items",
      "Expected shipments and provider movements",
      "Nicole decisions needed"
    ],
    "outputs": [
      "Opening checklist",
      "Prioritized work blocks",
      "Delivery and pickup plan",
      "Next-day garment staging list",
      "Closing checklist"
    ],
    "roadmap": [
      "Daily planning wizard",
      "Drag-and-order priorities",
      "Printable daily sheet",
      "Carry-forward unresolved items"
    ],
    "security": "This can be a public-safe local tool if it uses generic task labels and stores no client data.",
    "embedUrl": "",
    "launchUrl": ""
  },
  {
    "slug": "handoff-brief-generator",
    "title": "Handoff & Exception Brief Generator",
    "glyph": "HB",
    "category": "Daily Control",
    "priority": "Build first",
    "status": "Ready to vibe code",
    "summary": "Produces the short daily handoff Nicole or a coverage assistant can actually use.",
    "why": "A useful handoff must distinguish Critical risks, waiting items, tomorrow\u2019s physical movements, and exact decisions needed.",
    "inputs": [
      "Critical issues",
      "Waiting on whom and since when",
      "Tomorrow\u2019s appointments and garments",
      "Custody changes",
      "Decision questions and recommendation"
    ],
    "outputs": [
      "Daily handoff",
      "Nicole decision list",
      "Coverage brief",
      "Weekly unresolved-item summary"
    ],
    "roadmap": [
      "Structured handoff form",
      "Automatic priority ordering",
      "Copy, print, PDF, and email-ready outputs",
      "Weekly roll-up"
    ],
    "security": "Keep real client details in an approved internal version or redact them before export.",
    "embedUrl": "",
    "launchUrl": ""
  },
  {
    "slug": "contact-escalation-directory",
    "title": "Contact & Escalation Directory",
    "glyph": "CE",
    "category": "Reference",
    "priority": "High value",
    "status": "Placeholder",
    "summary": "A searchable, role-based directory for factories, tailors, accounting, payroll, shipping, and escalation paths.",
    "why": "The source material contains useful contacts, but names, responsibilities, phone numbers, and emails change and should not be scattered through manuals.",
    "inputs": [
      "Function or issue",
      "Organization",
      "Primary and backup contact",
      "Best channel",
      "Last verified date"
    ],
    "outputs": [
      "Who-to-contact result",
      "Required information checklist",
      "Verification-age warning",
      "Escalation path"
    ],
    "roadmap": [
      "Search and filters",
      "Verification dates",
      "CSV import/export",
      "Print-ready controlled directory"
    ],
    "security": "A public GitHub Pages deployment should not include internal or personal contact details.",
    "embedUrl": "",
    "launchUrl": ""
  },
  {
    "slug": "training-scenario-lab",
    "title": "Training Scenario Lab",
    "glyph": "TS",
    "category": "Training",
    "priority": "High value",
    "status": "Placeholder",
    "summary": "Interactive replacement training using realistic shipment, WIP, inventory, alteration, and escalation scenarios.",
    "why": "The new assistant needs guided practice and competency sign-off, not only manuals to read.",
    "inputs": [
      "Training module",
      "Scenario difficulty",
      "Trainee response",
      "Trainer feedback"
    ],
    "outputs": [
      "Decision explanation",
      "Missed control points",
      "Practice score",
      "Competency record"
    ],
    "roadmap": [
      "Scenario library",
      "Branching choices",
      "Trainer mode",
      "Printable sign-off report"
    ],
    "security": "Use fictional clients and demo records only.",
    "embedUrl": "",
    "launchUrl": ""
  },
  {
    "slug": "manual-sop-library",
    "title": "Manual & SOP Library",
    "glyph": "ML",
    "category": "Training",
    "priority": "Build first",
    "status": "Ready for links",
    "summary": "One controlled place for the full manual, quick guide, forms, screenshots, and current office procedures.",
    "why": "The replacement should not have to search chats, email attachments, and old copies for the current procedure.",
    "inputs": [
      "Document title",
      "Version and owner",
      "File or approved Drive URL",
      "Review date",
      "Superseded status"
    ],
    "outputs": [
      "Searchable document library",
      "Current-version indicator",
      "Review-due list",
      "Quick-reference downloads"
    ],
    "roadmap": [
      "Resource cards",
      "Version labels",
      "Search and categories",
      "Optional Google Drive links"
    ],
    "security": "Do not publish internal manuals or contact directories on a public Pages site unless the content has been approved for public access.",
    "embedUrl": "",
    "launchUrl": ""
  },
  {
    "slug": "swatch-lookbook-studio",
    "title": "Swatch Lookbook Studio",
    "glyph": "SL",
    "category": "Creative Tools",
    "priority": "Future embed",
    "status": "Embed existing or future app",
    "summary": "Launches the swatch-to-occasion lookbook generator from the same operations portal.",
    "why": "The office can keep creative sales-support tools beside operational programs without mixing their data or codebases.",
    "inputs": [
      "Fabric swatch",
      "Garment type",
      "Occasions and styling options"
    ],
    "outputs": [
      "Professional, happy-hour, vacation, and family/church visual concepts"
    ],
    "roadmap": [
      "Configure the existing app URL",
      "Use iframe when the host permits it",
      "Provide a launch-link fallback",
      "Add generated-lookbook library later"
    ],
    "security": "Do not upload client images or confidential fabric/order records unless the embedded tool is approved for them.",
    "embedUrl": "",
    "launchUrl": ""
  },
  {
    "slug": "back-office-packet-builder",
    "title": "Back-Office Packet Builder",
    "glyph": "BO",
    "category": "Conditional Admin",
    "priority": "Conditional",
    "status": "Placeholder",
    "summary": "Guided packet assembly for reimbursements, tailor payroll, employee payroll, or deposit documentation\u2014only when assigned.",
    "why": "These officewide procedures are structured but financially sensitive and should remain clearly separate from Nicole\u2019s core sales-assistant work.",
    "inputs": [
      "Assigned packet type",
      "Pay period or transaction date",
      "Supporting documents",
      "Approvals and totals",
      "Submission recipient"
    ],
    "outputs": [
      "Completeness checklist",
      "Packet naming standard",
      "Reconciliation warnings",
      "Submission log"
    ],
    "roadmap": [
      "Packet-type templates",
      "Required-document validation",
      "PDF merge and cover sheet",
      "Submission receipt log"
    ],
    "security": "Payroll, payment, banking, and reimbursement data must never be stored in a public static site.",
    "embedUrl": "",
    "launchUrl": ""
  }
];
