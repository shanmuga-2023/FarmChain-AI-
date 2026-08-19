import sys
import os
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# 1. Create Architecture Diagram Image
def generate_architecture_image(output_path="architecture_diagram.png"):
    fig, ax = plt.subplots(figsize=(7.2, 4.0), dpi=300)
    fig.patch.set_facecolor('#111318')
    ax.set_facecolor('#111318')

    c_red = '#D91E27'
    c_blue = '#3B82F6'
    c_green = '#10B981'
    c_amber = '#F59E0B'
    c_card = '#1C1F2B'
    c_subcard = '#282D3F'
    c_white = '#FFFFFF'
    c_light = '#E2E8F0'

    # Layer 1: Client Layer
    r1 = patches.FancyBboxPatch((0.02, 0.72), 0.96, 0.24, boxstyle='round,pad=0.015,rounding_size=0.03',
                               facecolor=c_card, edgecolor=c_red, linewidth=1.8)
    ax.add_patch(r1)
    ax.text(0.5, 0.90, 'PRESENTATION & STAKEHOLDER APPS (Vite + Vanilla JS SPA)', 
            ha='center', va='center', color=c_white, fontsize=8.2, fontweight='bold', family='sans-serif')

    boxes_l1 = [
        ('Farmer App\n[Voice AI: HI/TA/EN]', 0.14),
        ('Intermediary\n[B2B Wholesale]', 0.38),
        ('Retailer Portal\n[Shelf QR Tags]', 0.62),
        ('Consumer & Admin\n[Trace & Security]', 0.86)
    ]
    for text, xpos in boxes_l1:
        sub = patches.FancyBboxPatch((xpos - 0.10, 0.74), 0.20, 0.13, boxstyle='round,pad=0.01,rounding_size=0.02',
                                     facecolor=c_subcard, edgecolor='#3E455E', linewidth=1)
        ax.add_patch(sub)
        ax.text(xpos, 0.805, text, ha='center', va='center', color=c_light, fontsize=6.8, fontweight='bold', family='sans-serif')

    # Arrow 1 -> 2
    ax.annotate('', xy=(0.5, 0.66), xytext=(0.5, 0.72),
                arrowprops=dict(arrowstyle='->,head_width=0.35,head_length=0.5', color=c_red, lw=2))

    # Layer 2: Real-Time API & AI
    r2_1 = patches.FancyBboxPatch((0.02, 0.37), 0.46, 0.27, boxstyle='round,pad=0.015,rounding_size=0.03',
                                  facecolor=c_card, edgecolor=c_blue, linewidth=1.5)
    ax.add_patch(r2_1)
    ax.text(0.25, 0.59, 'REAL-TIME BACKEND & ORACLES', ha='center', va='center', color='#60A5FA', fontsize=7.8, fontweight='bold', family='sans-serif')
    t_api = "• Node.js & Express.js REST API\n• Socket.io 2-Event Sync Service\n• eNAM / AgMarkNet Mandi Oracle\n• Resilient Offline Rate Caching"
    ax.text(0.05, 0.47, t_api, ha='left', va='center', color=c_light, fontsize=6.5, family='sans-serif', linespacing=1.35)

    r2_2 = patches.FancyBboxPatch((0.52, 0.37), 0.46, 0.27, boxstyle='round,pad=0.015,rounding_size=0.03',
                                  facecolor=c_card, edgecolor=c_green, linewidth=1.5)
    ax.add_patch(r2_2)
    ax.text(0.75, 0.59, 'AI & INTELLIGENCE ENGINE', ha='center', va='center', color='#34D399', fontsize=7.8, fontweight='bold', family='sans-serif')
    t_ai = "• APMC Mandi Price Predictor ML\n• Live Anomaly & Fraud Spike Detector\n• Predictive Crop Demand Engine\n• Vernacular Speech NLP Parser"
    ax.text(0.55, 0.47, t_ai, ha='left', va='center', color=c_light, fontsize=6.5, family='sans-serif', linespacing=1.35)

    # Arrows 2 -> 3
    ax.annotate('', xy=(0.25, 0.30), xytext=(0.25, 0.37),
                arrowprops=dict(arrowstyle='->,head_width=0.35,head_length=0.5', color=c_blue, lw=1.8))
    ax.annotate('', xy=(0.75, 0.30), xytext=(0.75, 0.37),
                arrowprops=dict(arrowstyle='->,head_width=0.35,head_length=0.5', color=c_green, lw=1.8))

    # Layer 3: Web3 & Smart Contracts
    r3 = patches.FancyBboxPatch((0.02, 0.03), 0.96, 0.25, boxstyle='round,pad=0.015,rounding_size=0.03',
                               facecolor=c_card, edgecolor=c_amber, linewidth=1.8)
    ax.add_patch(r3)
    ax.text(0.5, 0.23, 'TRUSTLESS BLOCKCHAIN & SOLIDITY SMART CONTRACTS (EVM / Sepolia)', 
            ha='center', va='center', color='#FBBF24', fontsize=8.0, fontweight='bold', family='sans-serif')

    boxes_l3 = [
        ('MarketplaceEscrow\n[60/20/15/5% Split]', 0.14),
        ('ProductRegistry\n[Batch Metadata & QR]', 0.38),
        ('SupplyChainTracker\n[Cold-Chain Handoffs]', 0.62),
        ('QualityCertifier\n[AGMARK & Lab Tests]', 0.86)
    ]
    for text, xpos in boxes_l3:
        sub = patches.FancyBboxPatch((xpos - 0.10, 0.055), 0.20, 0.135, boxstyle='round,pad=0.01,rounding_size=0.02',
                                     facecolor=c_subcard, edgecolor='#3E455E', linewidth=1)
        ax.add_patch(sub)
        ax.text(xpos, 0.12, text, ha='center', va='center', color=c_light, fontsize=6.5, fontweight='bold', family='sans-serif')

    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')

    plt.subplots_adjust(left=0.01, right=0.99, top=0.99, bottom=0.01)
    plt.savefig(output_path, dpi=300, facecolor='#111318', edgecolor='none')
    plt.close()
    print(f"Generated {output_path}")

# Helper to format text box with red header and light body paragraphs
def set_box_content(shape, header, body_items, header_color=RGBColor(217, 30, 39), header_size=Pt(12), body_size=Pt(9.5)):
    tf = shape.text_frame
    tf.word_wrap = True
    tf.clear()
    
    first = True
    if header:
        p = tf.paragraphs[0]
        first = False
        p.text = header
        p.font.bold = True
        p.font.size = header_size
        p.font.name = "Calibri"
        p.font.color.rgb = header_color
        p.space_after = Pt(2)
        p.line_spacing = 1.05
    
    for item in body_items:
        if first:
            p = tf.paragraphs[0]
            first = False
        else:
            p = tf.add_paragraph()
        p.text = item
        p.font.bold = False
        p.font.size = body_size
        p.font.name = "Calibri"
        p.font.color.rgb = RGBColor(235, 235, 235)
        p.space_after = Pt(2)
        p.line_spacing = 1.05

def main():
    prs = pptx.Presentation('H20_PPT_Template.pptx')
    generate_architecture_image('architecture_diagram.png')

    # ==================== SLIDE 1: Cover Slide ====================
    s1 = prs.slides[0]
    
    # Team Name (Shape 4 / Text 5)
    set_box_content(s1.shapes[4], "TEAM NAME", ["The Knowledge Knights"], header_size=Pt(11), body_size=Pt(13))
    s1.shapes[4].text_frame.paragraphs[1].font.bold = True
    s1.shapes[4].text_frame.paragraphs[1].font.color.rgb = RGBColor(255, 255, 255)

    # Team ID (Shape 6 / Text 7)
    set_box_content(s1.shapes[6], "TEAM ID", ["CDT-09"], header_size=Pt(11), body_size=Pt(13))
    s1.shapes[6].text_frame.paragraphs[1].font.bold = True
    s1.shapes[6].text_frame.paragraphs[1].font.color.rgb = RGBColor(255, 255, 255)

    # Problem Statement ID (Shape 8 / Text 9)
    set_box_content(s1.shapes[8], "PROBLEM STATEMENT NUMBER (PS ID)", 
                    ["CDT-09 - FarmChain AI: Blockchain-Based Transparent Marketplace"], 
                    header_size=Pt(11), body_size=Pt(11.5))
    s1.shapes[8].text_frame.paragraphs[1].font.bold = True
    s1.shapes[8].text_frame.paragraphs[1].font.color.rgb = RGBColor(255, 255, 255)

    # Domain (Shape 10 / Text 11)
    set_box_content(s1.shapes[10], "DOMAIN / THEME", ["Cybersecurity & Digital Trust"], 
                    header_size=Pt(11), body_size=Pt(12.5))
    s1.shapes[10].text_frame.paragraphs[1].font.bold = True
    s1.shapes[10].text_frame.paragraphs[1].font.color.rgb = RGBColor(255, 255, 255)

    # Team Members Header (Shape 12 / Text 13)
    s1.shapes[12].text_frame.paragraphs[0].text = "TEAM MEMBERS"
    s1.shapes[12].text_frame.paragraphs[0].font.bold = True
    s1.shapes[12].text_frame.paragraphs[0].font.size = Pt(14)
    s1.shapes[12].text_frame.paragraphs[0].font.color.rgb = RGBColor(217, 30, 39)

    # 1. Team Lead (Shape 13 / Text 14)
    set_box_content(s1.shapes[13], "1. Team Lead: Harish Raghavendra V", 
                    ["Batch: 261223 | Dept: CSE(AIML) | Year: IV"], 
                    header_color=RGBColor(255, 255, 255), header_size=Pt(11.5), body_size=Pt(10))
    s1.shapes[13].text_frame.paragraphs[0].font.bold = True

    # 2. Member (Shape 15 / Text 16)
    set_box_content(s1.shapes[15], "2. Member: Shanmugasundaram G", 
                    ["Batch: 261095 | Dept: CSE | Year: IV (Sec B)"], 
                    header_color=RGBColor(255, 255, 255), header_size=Pt(11.5), body_size=Pt(10))
    s1.shapes[15].text_frame.paragraphs[0].font.bold = True

    # 3. Member (Shape 17 / Text 18)
    set_box_content(s1.shapes[17], "3. Member: Radhika S", 
                    ["Batch: 261238 | Dept: CSE(AIML) | Year: IV"], 
                    header_color=RGBColor(255, 255, 255), header_size=Pt(11.5), body_size=Pt(10))
    s1.shapes[17].text_frame.paragraphs[0].font.bold = True

    # 4. Member (Shape 19 / Text 20)
    set_box_content(s1.shapes[19], "4. Member: Sujith Chavan", 
                    ["Batch: 281107 | Dept: CSE | Year: II (Sec B)"], 
                    header_color=RGBColor(255, 255, 255), header_size=Pt(11.5), body_size=Pt(10))
    s1.shapes[19].text_frame.paragraphs[0].font.bold = True

    # ==================== SLIDE 2: Problem Statement ====================
    s2 = prs.slides[1]

    # Shape 5 (Text 5): What exact problem are you solving?
    set_box_content(s2.shapes[5], "What exact problem are you solving?", [
        "• Farmers lose 40–60% of crop value to predatory middlemen and opaque commissions.",
        "• Arbitrary spot rates force distress sales without real-time mandi benchmark transparency.",
        "• Produce counterfeiting and lack of provenance risk consumer health with zero accountability."
    ], header_size=Pt(11.5), body_size=Pt(9.0))

    # Shape 7 (Text 7): Who is affected by this problem?
    set_box_content(s2.shapes[7], "Who is affected by this problem?", [
        "• 140M+ Indian smallholder farmers facing low realization and delayed payment settlements.",
        "• Millions of retail consumers paying inflated prices for unverified, potentially fake produce.",
        "• Honest retailers & aggregators unable to prove authenticity or quality compliance."
    ], header_size=Pt(11.5), body_size=Pt(9.0))

    # Shape 9 (Text 9): Current Solutions & Limitations
    set_box_content(s2.shapes[9], "Current Solutions & Limitations", [
        "• APMC Mandis: Complex multi-middlemen cartels with non-transparent price manipulation.",
        "• Centralized E-commerce: High commission cuts (15–30%) with zero escrow payment security.",
        "• Paper Quality Certificates: Easily forged with no tamper-proof cryptographic audit trail."
    ], header_size=Pt(11.5), body_size=Pt(9.0))

    # Right Box Header (Shape 11 / Text 13)
    s2.shapes[11].text_frame.paragraphs[0].text = "Problem Impact & Scale"
    s2.shapes[11].text_frame.paragraphs[0].font.bold = True
    s2.shapes[11].text_frame.paragraphs[0].font.size = Pt(13)
    s2.shapes[11].text_frame.paragraphs[0].font.color.rgb = RGBColor(217, 30, 39)

    # Right Box Content (Shape 12 / Text 14)
    tf_impact = s2.shapes[12].text_frame
    tf_impact.word_wrap = True
    tf_impact.clear()
    
    p1_head = tf_impact.paragraphs[0]
    p1_head.text = "Who is most affected?"
    p1_head.font.bold = True
    p1_head.font.size = Pt(10.5)
    p1_head.font.color.rgb = RGBColor(255, 255, 255)
    
    p1_body = tf_impact.add_paragraph()
    p1_body.text = "140M+ Indian smallholder farmers & millions of retail consumers nationwide."
    p1_body.font.size = Pt(9.0)
    p1_body.font.color.rgb = RGBColor(220, 220, 220)
    p1_body.space_after = Pt(6)

    p2_head = tf_impact.add_paragraph()
    p2_head.text = "Key Data Point:"
    p2_head.font.bold = True
    p2_head.font.size = Pt(10.5)
    p2_head.font.color.rgb = RGBColor(255, 255, 255)

    p2_body = tf_impact.add_paragraph()
    p2_body.text = "40–60% crop value lost to middlemen; 0% escrow security in traditional trade."
    p2_body.font.size = Pt(9.0)
    p2_body.font.color.rgb = RGBColor(220, 220, 220)
    p2_body.space_after = Pt(6)

    p3_head = tf_impact.add_paragraph()
    p3_head.text = "Frequency / Urgency:"
    p3_head.font.bold = True
    p3_head.font.size = Pt(10.5)
    p3_head.font.color.rgb = RGBColor(255, 255, 255)

    p3_body = tf_impact.add_paragraph()
    p3_body.text = "Occurs daily across harvest cycles, causing severe farmer debt & food fraud."
    p3_body.font.size = Pt(9.0)
    p3_body.font.color.rgb = RGBColor(220, 220, 220)

    # Clear TextBox 22 ("…") on Slide 2 if present
    for sh in s2.shapes:
        if sh.has_text_frame and sh.text_frame.text.strip() == "…":
            sh.text_frame.clear()

    # ==================== SLIDE 3: Proposed Solution ====================
    s3 = prs.slides[2]

    # Shape 5 (Text 5): Briefly explain proposed solution
    set_box_content(s3.shapes[5], "Briefly explain the proposed solution — what it is and how it works", [
        "FarmChain AI is a decentralized Web3 agritech trust protocol combining EVM Solidity smart contracts, live eNAM/AgMarkNet Mandi price oracles, vernacular voice crop registration, and cryptographic QR provenance."
    ], header_size=Pt(11.5), body_size=Pt(9.2))

    # Shape 7 (Text 7): Describe how it directly addresses the problem
    set_box_content(s3.shapes[7], "Describe how it directly addresses the problem stated earlier", [
        "• Trustless Escrow automatically splits revenue (60% Farmer / 20% Trader / 15% Retailer / 5% Platform) upon delivery.",
        "• Vernacular Voice AI enables rural farmers to register crops speaking naturally in Hindi, Tamil, or English.",
        "• Cryptographic QR codes eliminate counterfeit produce with instant mobile verification alerts."
    ], header_size=Pt(11.5), body_size=Pt(9.0))

    # Shape 9 (Text 9): USP / Novelty
    set_box_content(s3.shapes[9], "Unique Selling Proposition/Novelty of your Solution", [
        "• Dual-Trust Protocol: Cryptographic anti-tamper QR provenance + Live APMC Mandi fair benchmark oracle.",
        "• Real-Time Anomaly & Fraud Detection Engine flagging predatory price spikes (>50% above fair benchmark).",
        "• Public Testnet Explorer Verification (Etherscan/Basescan) for 100% transparent digital trust."
    ], header_size=Pt(11.5), body_size=Pt(9.0))

    # Bottom 3 Cards:
    # Shape 11: CORE FEATURE
    set_box_content(s3.shapes[11], "CORE FEATURE", [
        "Decentralized Escrow Protocol with automated 60/20/15/5% split, Vernacular Voice AI crop listing, and tamper-proof QR provenance tracking."
    ], header_size=Pt(11), body_size=Pt(8.5))

    # Shape 13: KEY BENEFITS
    set_box_content(s3.shapes[13], "KEY BENEFITS", [
        "+40% higher farmer revenue realization, 0% payment default risk, real-time fair Mandi pricing, and 100% end-to-end food traceability."
    ], header_size=Pt(11), body_size=Pt(8.5))

    # Shape 15: TARGET USER
    set_box_content(s3.shapes[15], "TARGET USER", [
        "Smallholder Farmers, Agri Intermediaries, Supermarket Retailers, and Health/Quality-conscious Consumers."
    ], header_size=Pt(11), body_size=Pt(8.5))

    # ==================== SLIDE 4: Methodology & Tech Stack ====================
    s4 = prs.slides[3]

    # Shape 5 (Text 5): Workflow step by step
    set_box_content(s4.shapes[5], "How will the solution work, step by step?", [
        "1. Farmer registers crop via Vernacular Voice AI in native language (HI/TA/EN).",
        "2. Mandi Oracle benchmarks fair spot price & mints batch on EVM blockchain.",
        "3. Consumer/Buyer places order -> Smart Escrow locks payment funds.",
        "4. QR scanned across logistics -> Delivery scan triggers instant 60% farmer payout."
    ], header_size=Pt(11.5), body_size=Pt(8.8))

    # Shape 7 (Text 7): Technologies used
    set_box_content(s4.shapes[7], "Technologies / tools / frameworks used", [
        "• Web3: Solidity 0.8.20, Hardhat, Ethers.js, Sepolia Testnet",
        "• Frontend: Vite, Vanilla JS, Web Speech API (Voice AI), Responsive CSS",
        "• Backend: Node.js, Express.js, Socket.io (2-event real-time sync)",
        "• AI/ML: APMC Mandi Spot Rate Predictor & Real-Time Fraud Spike Detector"
    ], header_size=Pt(11.5), body_size=Pt(8.8))

    # Shape 9 (Text 9): Implementation Strategy
    set_box_content(s4.shapes[9], "Development approach - Implementation Strategy", [
        "• Modular smart contract suite with OpenZeppelin security standards.",
        "• Resilient local caching for zero-freeze live Mandi demo reliability.",
        "• Strict Role-Based Access Control (RBAC) protecting all 5 dashboards."
    ], header_size=Pt(11.5), body_size=Pt(8.8))

    # Right Box Header: TECH STACK (Shape 11 / Text 11)
    s4.shapes[11].text_frame.paragraphs[0].text = "TECH STACK"
    s4.shapes[11].text_frame.paragraphs[0].font.bold = True
    s4.shapes[11].text_frame.paragraphs[0].font.size = Pt(13)
    s4.shapes[11].text_frame.paragraphs[0].font.color.rgb = RGBColor(217, 30, 39)

    # UI (Shape 13 / Text 13)
    set_box_content(s4.shapes[13], "UI / Frontend", [
        "Vite + Vanilla JS, Web Speech API (Voice AI), Lucide Icons, Glassmorphic CSS"
    ], header_size=Pt(10), body_size=Pt(8.5))

    # Backend (Shape 15 / Text 15)
    set_box_content(s4.shapes[15], "Backend & Real-Time", [
        "Node.js, Express.js, Socket.io (Live Sync), eNAM & AgMarkNet Mandi Oracles"
    ], header_size=Pt(10), body_size=Pt(8.5))

    # Database (Shape 17 / Text 17)
    set_box_content(s4.shapes[17], "Database & Ledger", [
        "Ethereum Sepolia / EVM Ledger, LocalStorage Cache, In-Memory State"
    ], header_size=Pt(10), body_size=Pt(8.5))

    # Core Logic (Shape 19 / Text 19)
    set_box_content(s4.shapes[19], "Core Logic (AI & Web3)", [
        "Solidity Escrow & Quality Contracts, APMC Price ML, Fraud Anomaly Detector"
    ], header_size=Pt(10), body_size=Pt(8.5))

    # ==================== SLIDE 5: System Architecture ====================
    s5 = prs.slides[4]

    # Clear placeholder text in Shape 4
    s5.shapes[4].text_frame.clear()

    # Insert Architecture Diagram Image inside the box (pos: left=822960, top=2148840, width=6949440, height=3931920)
    # Add picture slightly inset
    img_left = Inches(0.95)
    img_top = Inches(2.38)
    img_width = Inches(7.55)
    img_height = Inches(4.25)
    s5.shapes.add_picture('architecture_diagram.png', img_left, img_top, width=img_width, height=img_height)

    # Right Box Header (Shape 6 / Text 6)
    s5.shapes[6].text_frame.paragraphs[0].text = "SYSTEM HIGHLIGHTS"
    s5.shapes[6].text_frame.paragraphs[0].font.bold = True
    s5.shapes[6].text_frame.paragraphs[0].font.size = Pt(13)
    s5.shapes[6].text_frame.paragraphs[0].font.color.rgb = RGBColor(217, 30, 39)

    # Shape 8 (Basic workflow or system flow)
    set_box_content(s5.shapes[8], "Basic Workflow & System Flow", [
        "Seamless pipeline from vernacular voice listing to automated escrow lock, real-time tracking, and instant cryptographic settlement upon QR delivery scan."
    ], header_size=Pt(10.5), body_size=Pt(8.5))

    # Shape 10 (Data flow between components)
    set_box_content(s5.shapes[10], "Data Flow Between Components", [
        "Real-time bidirectional WebSocket events (ORDER_PLACED, ORDER_STATUS_CHANGED) coupled with immutable on-chain state updates."
    ], header_size=Pt(10.5), body_size=Pt(8.5))

    # Shape 12 (Feasibility at student / prototype level)
    set_box_content(s5.shapes[12], "Feasibility & Live Prototype", [
        "Fully functional live working prototype on Sepolia testnet, with live Etherscan verification, zero paid API dependencies, and offline resilience."
    ], header_size=Pt(10.5), body_size=Pt(8.5))

    # ==================== SLIDE 6: Impact & Viability ====================
    s6 = prs.slides[5]

    # Top Box Header (Shape 4 / Text 4)
    s6.shapes[4].text_frame.paragraphs[0].text = "EXPECTED IMPACT"
    s6.shapes[4].text_frame.paragraphs[0].font.bold = True
    s6.shapes[4].text_frame.paragraphs[0].font.size = Pt(13)
    s6.shapes[4].text_frame.paragraphs[0].font.color.rgb = RGBColor(217, 30, 39)

    # Shape 6 (Who will benefit?)
    set_box_content(s6.shapes[6], "Who will benefit from this solution?", [
        "• 140M+ Indian smallholder farmers gain direct market access, fair pricing, and immediate digital payment settlements.",
        "• Consumers get 100% verified, authentic produce with full farm-to-table transparency and zero counterfeit risk."
    ], header_size=Pt(10.5), body_size=Pt(8.8))

    # Shape 8 (Social / economic / environmental impact)
    set_box_content(s6.shapes[8], "Social, Economic & Environmental Impact", [
        "• Economic: Eliminates 40–60% predatory middlemen cuts; guarantees 60% revenue distribution to farmers.",
        "• Social: Empowers non-tech rural farmers via vernacular voice AI in their native languages.",
        "• Environmental: Cold-chain tracking reduces post-harvest transit spoilage and food waste."
    ], header_size=Pt(10.5), body_size=Pt(8.8))

    # Shape 10 (Measurable outcomes)
    set_box_content(s6.shapes[10], "Measurable Outcomes You Expect", [
        "• +40% increase in farmer profit margins | 0% payment fraud/default risk | 100% cryptographic batch provenance."
    ], header_size=Pt(10.5), body_size=Pt(8.8))

    # Bottom 3 Cards:
    # USE CASE (Shape 12 / Text 12, Shape 13 / Text 13)
    s6.shapes[12].text_frame.paragraphs[0].text = "USE CASE"
    s6.shapes[12].text_frame.paragraphs[0].font.bold = True
    s6.shapes[12].text_frame.paragraphs[0].font.size = Pt(11)
    s6.shapes[12].text_frame.paragraphs[0].font.color.rgb = RGBColor(217, 30, 39)
    
    set_box_content(s6.shapes[13], None, [
        "A Tamil Nadu farmer speaks in Tamil: '500kg Basmati Rice at ₹48'. Smart contract mints batch. Consumer buys produce, escrow locks payment, and funds release instantly to farmer upon QR scan on delivery."
    ], body_size=Pt(8.5))

    # SCALABILITY (Shape 15 / Text 15, Shape 16 / Text 16)
    s6.shapes[15].text_frame.paragraphs[0].text = "SCALABILITY"
    s6.shapes[15].text_frame.paragraphs[0].font.bold = True
    s6.shapes[15].text_frame.paragraphs[0].font.size = Pt(11)
    s6.shapes[15].text_frame.paragraphs[0].font.color.rgb = RGBColor(217, 30, 39)

    set_box_content(s6.shapes[16], None, [
        "Layer-2 Rollup / Polygon / Base EVM compatibility for sub-cent gas fees and high transaction throughput. Decoupled microservices scaling across thousands of mandis nationwide."
    ], body_size=Pt(8.5))

    # FEASIBILITY (Shape 18 / Text 18, Shape 19 / Text 19)
    s6.shapes[18].text_frame.paragraphs[0].text = "FEASIBILITY"
    s6.shapes[18].text_frame.paragraphs[0].font.bold = True
    s6.shapes[18].text_frame.paragraphs[0].font.size = Pt(11)
    s6.shapes[18].text_frame.paragraphs[0].font.color.rgb = RGBColor(217, 30, 39)

    set_box_content(s6.shapes[19], None, [
        "Utilizes existing mobile browsers and standard cameras for QR scanning—no custom hardware needed. Zero learning curve due to intuitive vernacular voice assistance."
    ], body_size=Pt(8.5))

    # ==================== SLIDE 7: Thank You Slide ====================
    s7 = prs.slides[6]
    # Add subtitle text box below THANK YOU if not present
    # THANK YOU is at top=1320581, height=707886. Let's add details below it
    tb = s7.shapes.add_textbox(Inches(2.5), Inches(2.3), Inches(8.3), Inches(1.2))
    tf_ty = tb.text_frame
    tf_ty.word_wrap = True
    p_ty1 = tf_ty.paragraphs[0]
    p_ty1.alignment = PP_ALIGN.CENTER
    p_ty1.text = "Team: The Knowledge Knights  |  Theme: Cybersecurity & Digital Trust"
    p_ty1.font.bold = True
    p_ty1.font.size = Pt(14)
    p_ty1.font.name = "Calibri"
    p_ty1.font.color.rgb = RGBColor(217, 30, 39)

    p_ty2 = tf_ty.add_paragraph()
    p_ty2.alignment = PP_ALIGN.CENTER
    p_ty2.text = "PS ID: CDT-09 - FarmChain AI: Blockchain-Based Transparent Marketplace"
    p_ty2.font.bold = True
    p_ty2.font.size = Pt(13)
    p_ty2.font.name = "Calibri"
    p_ty2.font.color.rgb = RGBColor(255, 255, 255)

    p_ty3 = tf_ty.add_paragraph()
    p_ty3.alignment = PP_ALIGN.CENTER
    p_ty3.text = "Harish Raghavendra V (Lead) • Shanmugasundaram G • Radhika S • Sujith Chavan"
    p_ty3.font.size = Pt(11)
    p_ty3.font.name = "Calibri"
    p_ty3.font.color.rgb = RGBColor(200, 200, 200)

    # Save presentation
    prs.save('H20_PPT_Template.pptx')
    print("Successfully updated H20_PPT_Template.pptx!")

if __name__ == '__main__':
    main()
