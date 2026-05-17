from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from datetime import datetime
from database import Database
import os

class ReportGenerator:
    def __init__(self):
        self.db = Database()
    
    def generate_daily_report(self, date=None):
        """Générer rapport PDF quotidien"""
        if not date:
            date = datetime.now().strftime("%Y-%m-%d")
        
        attendance_data = self.db.get_attendance_by_date(date)
        stats = self.db.get_attendance_stats(date)
        
        # Création du PDF
        filename = f"rapport_presence_{date}.pdf"
        doc = SimpleDocTemplate(filename, pagesize=A4, 
                                rightMargin=72, leftMargin=72,
                                topMargin=72, bottomMargin=72)
        
        styles = getSampleStyleSheet()
        
        # Style personnalisé pour le titre
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#003366'),
            spaceAfter=30,
            alignment=1  # Centré
        )
        
        # Style pour les sous-titres
        subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#666666'),
            spaceAfter=20,
            alignment=1
        )
        
        story = []
        
        # En-tête
        story.append(Paragraph(f"Rapport de Présence", title_style))
        story.append(Paragraph(f"Date: {date}", subtitle_style))
        story.append(Spacer(1, 20))
        
        # Statistiques
        stats_data = [
            ['📊 Statistiques', ''],
            ['Total étudiants', str(stats['total_students'])],
            ['Présents', str(stats['present_count'])],
            ['Absents', str(stats['absent_count'])],
            ['Taux de présence', f"{stats['attendance_rate']:.1f}%"]
        ]
        
        stats_table = Table(stats_data, colWidths=[3*inch, 2*inch])
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#003366')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 11),
            ('TOPPADDING', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ]))
        story.append(stats_table)
        story.append(Spacer(1, 30))
        
        # Liste des présences
        if attendance_data:
            presence_title = Paragraph("Liste des étudiants présents", styles['Heading2'])
            story.append(presence_title)
            story.append(Spacer(1, 10))
            
            presence_list = [['#', 'ID Étudiant', 'Nom', 'Heure d\'arrivée']]
            for i, record in enumerate(attendance_data, 1):
                presence_list.append([str(i), record.student_id, record.name, record.time])
            
            presence_table = Table(presence_list, colWidths=[0.5*inch, 1.5*inch, 2.5*inch, 1.5*inch])
            presence_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4CAF50')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('ALIGN', (1, 1), (1, -1), 'CENTER'),
                ('ALIGN', (3, 1), (3, -1), 'CENTER'),
            ]))
            story.append(presence_table)
        else:
            no_data = Paragraph("Aucune présence enregistrée pour cette date", styles['Normal'])
            story.append(no_data)
        
        # Pied de page
        story.append(Spacer(1, 50))
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=1
        )
        story.append(Paragraph(f"Généré le {datetime.now().strftime('%d/%m/%Y à %H:%M:%S')}", footer_style))
        
        # Génération
        doc.build(story)
        return filename
    
    def generate_monthly_report(self, year, month):
        """Générer rapport mensuel"""
        filename = f"rapport_mensuel_{year}_{month:02d}.pdf"
        doc = SimpleDocTemplate(filename, pagesize=A4)
        styles = getSampleStyleSheet()
        
        story = []
        
        # Titre
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#003366'),
            spaceAfter=30,
            alignment=1
        )
        
        mois = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
        
        story.append(Paragraph(f"Rapport Mensuel - {mois[month-1]} {year}", title_style))
        story.append(Spacer(1, 20))
        
        stats = self.db.get_monthly_stats(year, month)
        
        # Statistiques mensuelles
        total_presences = sum(stats['daily_stats'].values())
        jours_ouvres = len(stats['daily_stats'])
        
        summary_data = [
            ['📈 Résumé Mensuel', ''],
            ['Mois', f"{mois[month-1]} {year}"],
            ['Nombre de jours avec présence', str(jours_ouvres)],
            ['Total des présences', str(total_presences)],
            ['Moyenne par jour', f"{total_presences/jours_ouvres:.1f}" if jours_ouvres > 0 else "0"]
        ]
        
        summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#003366')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
        ]))
        story.append(summary_table)
        
        doc.build(story)
        return filename