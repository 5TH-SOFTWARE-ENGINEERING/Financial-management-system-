import json
from datetime import datetime
from typing import Dict, Any
import xml.etree.ElementTree as ET
from xml.dom import minidom
from ..models.sale import Sale

class InvoiceService:
    @staticmethod
    def generate_json_einvoice(sale: Sale) -> Dict[str, Any]:
        """
        Generate a standardized E-Invoice in JSON format (UBL-flavored).
        """
        invoice = {
            "invoice_id": sale.receipt_number or f"INV-{sale.id}",
            "issue_date": sale.created_at.strftime("%Y-%m-%d"),
            "currency": "USD", # Default to USD, could be from sale.item.warehouse.currency in future
            "merchant": {
                "name": "Next-Gen Enterprises", # Default merchant name
                "id": "GST-123456789"
            },
            "customer": {
                "name": sale.customer_name or "Cash Customer",
                "email": sale.customer_email or ""
            },
            "line_items": [
                {
                    "id": 1,
                    "description": sale.item.item_name if sale.item else "Unknown Item",
                    "sku": sale.item.sku if sale.item and sale.item.sku else "",
                    "quantity": float(sale.quantity_sold),
                    "unit_price": float(sale.selling_price),
                    "total_amount": float(sale.total_sale)
                }
            ],
            "totals": {
                "tax_exclusive_amount": float(sale.total_sale),
                "tax_inclusive_amount": float(sale.total_sale), # Assuming tax is included for now
                "payable_amount": float(sale.total_sale)
            }
        }
        return invoice

    @staticmethod
    def generate_ubl_xml(sale: Sale) -> str:
        """
        Generate a UBL 2.1 compliant XML invoice string.
        """
        # UBL Namespaces
        ns_ubl = "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
        ns_cac = "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
        ns_cbc = "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"

        ET.register_namespace('', ns_ubl)
        ET.register_namespace('cac', ns_cac)
        ET.register_namespace('cbc', ns_cbc)

        root = ET.Element(f"{{{ns_ubl}}}Invoice")
        
        # Basic Info
        cbc_id = ET.SubElement(root, f"{{{ns_cbc}}}ID")
        cbc_id.text = sale.receipt_number or f"INV-{sale.id}"
        
        cbc_date = ET.SubElement(root, f"{{{ns_cbc}}}IssueDate")
        cbc_date.text = sale.created_at.strftime("%Y-%m-%d")
        
        cbc_currency = ET.SubElement(root, f"{{{ns_cbc}}}DocumentCurrencyCode")
        cbc_currency.text = "USD"

        # Supplier (Merchant)
        cac_supplier = ET.SubElement(root, f"{{{ns_cac}}}AccountingSupplierParty")
        cac_party = ET.SubElement(cac_supplier, f"{{{ns_cac}}}Party")
        cac_party_name = ET.SubElement(cac_party, f"{{{ns_cac}}}PartyName")
        cbc_name = ET.SubElement(cac_party_name, f"{{{ns_cbc}}}Name")
        cbc_name.text = "Next-Gen Enterprises"

        # Customer
        cac_customer = ET.SubElement(root, f"{{{ns_cac}}}AccountingCustomerParty")
        cac_cparty = ET.SubElement(cac_customer, f"{{{ns_cac}}}Party")
        cac_cparty_name = ET.SubElement(cac_cparty, f"{{{ns_cac}}}PartyName")
        cbc_cname = ET.SubElement(cac_cparty_name, f"{{{ns_cbc}}}Name")
        cbc_cname.text = sale.customer_name or "Cash Customer"

        # Line Items
        cac_line = ET.SubElement(root, f"{{{ns_cac}}}InvoiceLine")
        cbc_line_id = ET.SubElement(cac_line, f"{{{ns_cbc}}}ID")
        cbc_line_id.text = "1"
        
        cbc_qty = ET.SubElement(cac_line, f"{{{ns_cbc}}}InvoicedQuantity")
        cbc_qty.text = str(sale.quantity_sold)
        
        cbc_line_ext = ET.SubElement(cac_line, f"{{{ns_cbc}}}LineExtensionAmount")
        cbc_line_ext.set("currencyID", "USD")
        cbc_line_ext.text = str(sale.total_sale)

        cac_item = ET.SubElement(cac_line, f"{{{ns_cac}}}Item")
        cbc_item_name = ET.SubElement(cac_item, f"{{{ns_cbc}}}Name")
        cbc_item_name.text = sale.item.item_name if sale.item else "Unknown Item"
        
        if sale.item and sale.item.sku:
            cac_identification = ET.SubElement(cac_item, f"{{{ns_cac}}}SellersItemIdentification")
            cbc_sku = ET.SubElement(cac_identification, f"{{{ns_cbc}}}ID")
            cbc_sku.text = sale.item.sku

        cac_price = ET.SubElement(cac_line, f"{{{ns_cac}}}Price")
        cbc_price_amt = ET.SubElement(cac_price, f"{{{ns_cbc}}}PriceAmount")
        cbc_price_amt.set("currencyID", "USD")
        cbc_price_amt.text = str(sale.selling_price)

        # Totals
        cac_legal = ET.SubElement(root, f"{{{ns_cac}}}LegalMonetaryTotal")
        cbc_payable = ET.SubElement(cac_legal, f"{{{ns_cbc}}}PayableAmount")
        cbc_payable.set("currencyID", "USD")
        cbc_payable.text = str(sale.total_sale)

        # Convert to string and pretty print
        xml_str = ET.tostring(root, encoding='utf-8')
        reparsed = minidom.parseString(xml_str)
        return reparsed.toprettyxml(indent="  ")

invoice_service = InvoiceService()
