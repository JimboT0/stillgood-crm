"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, CheckCircle, XCircle } from "lucide-react"
import { format } from "date-fns"
import type { OnboardingChecklist } from "@/lib/firebase/types"

interface OnboardingChecklistComponentProps {
  checklist: OnboardingChecklist
  onUpdate: (checklist: OnboardingChecklist) => void
  readonly?: boolean
}

export function OnboardingChecklistComponent({ 
  checklist, 
  onUpdate, 
  readonly = false 
}: OnboardingChecklistComponentProps) {
  const [localChecklist, setLocalChecklist] = useState<OnboardingChecklist>(checklist)

  const normalizeDate = (value: unknown): Date | null => {
    if (!value) return null
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value
    }
    if (typeof value === "string" || typeof value === "number") {
      const parsed = new Date(value)
      return isNaN(parsed.getTime()) ? null : parsed
    }
    if (typeof value === "object") {
      const maybeTimestamp = value as { seconds?: number; toDate?: () => Date }
      if (typeof maybeTimestamp.toDate === "function") {
        const parsed = maybeTimestamp.toDate()
        return isNaN(parsed.getTime()) ? null : parsed
      }
      if (typeof maybeTimestamp.seconds === "number") {
        const parsed = new Date(maybeTimestamp.seconds * 1000)
        return isNaN(parsed.getTime()) ? null : parsed
      }
    }
    return null
  }

  // Sync localChecklist when checklist prop changes
  useEffect(() => {
    console.log('[OnboardingChecklist] Checklist prop changed:', checklist)
    setLocalChecklist(checklist)
  }, [checklist])

  const updateField = (field: string, value: any) => {
    if (readonly) return
    // Convert undefined to false for boolean fields
    const finalValue = value === undefined ? false : value
    console.log(`[Checklist] Updating ${field}: ${finalValue} (${typeof finalValue})`)
    const updated = { ...localChecklist, [field]: finalValue }
    console.log(`[Checklist] Updated checklist:`, updated)
    setLocalChecklist(updated)
    // Call onUpdate with the new state immediately
    onUpdate(updated)
  }

  const updateNestedField = (parent: string, field: string, value: any) => {
    if (readonly) return
    // Convert undefined to false for boolean fields
    const finalValue = value === undefined ? false : value
    console.log(`[Checklist] Updating ${parent}.${field}: ${finalValue} (${typeof finalValue})`)
    const updated = { 
      ...localChecklist, 
      [parent]: { 
        ...(localChecklist[parent as keyof OnboardingChecklist] || {}), 
        [field]: finalValue 
      } 
    }
    console.log(`[Checklist] Updated nested checklist:`, updated)
    setLocalChecklist(updated)
    onUpdate(updated)
  }

  const getCompletionStats = () => {
    const fields = [
      'crmListingConfirmed', 'storeWhatsappGroupSetup',
      'allStaffAvailableForTraining', 'bagLoadingTrainingMaterial', 'collectionProcessVideo', 'websiteSystemWalkthrough',
      'introducedToStoreManager', 'allRelevantStaffPresent', 'wasteRemovalProcessTrained', 'wasteRecordingTrained',
      'correctBagPackingTrained', 'staffUnderstandingConfirmed', 'collectionTimesDiscussed', 'customerCollectionProceduresExplained',
      'retailerTrainedOnWebsite', 'storeLoginCreated', 'loadBagsLinkConfirmed',
      'flexMessagingSetup', 'bagsTapeStickersOrdered', 'trainingFullyCompleted'
    ]
    
    const categoriesCompleted = (localChecklist.categoriesActive?.produce ? 1 : 0) +
                               (localChecklist.categoriesActive?.bakery ? 1 : 0) +
                               (localChecklist.categoriesActive?.grocery ? 1 : 0)
    
    const completed = fields.filter(field => localChecklist[field as keyof OnboardingChecklist]).length + categoriesCompleted
    const total = fields.length + 3 // +3 for the categories
    
    return { completed, total, percentage: Math.round((completed / total) * 100) }
  }

  const stats = getCompletionStats()

  return (
    <div className="space-y-6">
      {/* Debug Panel */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm text-blue-800">Debug: Current Values</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-blue-700">
          <div className="grid grid-cols-2 gap-2">
            <div>FlexMS: <strong>{localChecklist.flexMessagingSetup?.toString() || 'undefined'}</strong></div>
            <div>Follow Up: <strong>{localChecklist.followUpRequired?.toString() || 'undefined'}</strong></div>
            <div>Produce: <strong>{localChecklist.categoriesActive?.produce?.toString() || 'undefined'}</strong></div>
            <div>Bakery: <strong>{localChecklist.categoriesActive?.bakery?.toString() || 'undefined'}</strong></div>
            <div>Grocery: <strong>{localChecklist.categoriesActive?.grocery?.toString() || 'undefined'}</strong></div>
            <div>CRM Listing: <strong>{localChecklist.crmListingConfirmed?.toString() || 'undefined'}</strong></div>
            <div>WhatsApp: <strong>{localChecklist.storeWhatsappGroupSetup?.toString() || 'undefined'}</strong></div>
            <div>Training Complete: <strong>{localChecklist.trainingFullyCompleted?.toString() || 'undefined'}</strong></div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Still Good - New Store Onboarding & Training Checklist
            <div className="flex items-center gap-2">
              <Badge variant={stats.percentage === 100 ? "default" : "secondary"}>
                {stats.completed}/{stats.total} Complete ({stats.percentage}%)
              </Badge>
              {stats.percentage === 100 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-orange-600" />
              )}
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* 1. Store Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1. Store Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="crmListingConfirmed"
              checked={localChecklist.crmListingConfirmed || false}
              onCheckedChange={(checked) => updateField('crmListingConfirmed', checked)}
              disabled={readonly}
            />
            <Label htmlFor="crmListingConfirmed">CRM Listing Confirmed</Label>
            <span className="text-xs text-gray-500 ml-2">({(localChecklist.crmListingConfirmed || false).toString()})</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="storeWhatsappGroupSetup"
              checked={localChecklist.storeWhatsappGroupSetup || false}
              onCheckedChange={(checked) => updateField('storeWhatsappGroupSetup', checked)}
              disabled={readonly}
            />
            <Label htmlFor="storeWhatsappGroupSetup">Store WhatsApp Group Set Up</Label>            <span className="text-xs text-gray-500 ml-2">({(localChecklist.storeWhatsappGroupSetup || false).toString()})</span>          </div>
        </CardContent>
      </Card>

      {/* 2. Store Management & Key Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2. Store Management & Key Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Contact information is managed in the main store contacts section.
          </p>
        </CardContent>
      </Card>

      {/* 3. Operational Staff */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">3. Operational Staff – Bag Loading Team</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Staff information (Produce, Bakery, Grocery, Floor Manager) is managed in the main store contacts section.
          </p>
        </CardContent>
      </Card>

      {/* 4. Training Preparation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">4. Training Preparation (Pre-Launch)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="allStaffAvailableForTraining"
              checked={localChecklist.allStaffAvailableForTraining || false}
              onCheckedChange={(checked) => updateField('allStaffAvailableForTraining', checked)}
              disabled={readonly}
            />
            <Label htmlFor="allStaffAvailableForTraining">All Required Staff Available for Training</Label>
          </div>

          <div className="ml-6 space-y-2">
            <Label className="text-sm font-medium">Training Resources Prepared:</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="bagLoadingTrainingMaterial"
                checked={localChecklist.bagLoadingTrainingMaterial || false}
                onCheckedChange={(checked) => updateField('bagLoadingTrainingMaterial', checked)}
                disabled={readonly}
              />
              <Label htmlFor="bagLoadingTrainingMaterial" className="text-sm">Bag loading training material</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="collectionProcessVideo"
                checked={localChecklist.collectionProcessVideo || false}
                onCheckedChange={(checked) => updateField('collectionProcessVideo', checked)}
                disabled={readonly}
              />
              <Label htmlFor="collectionProcessVideo" className="text-sm">Collection process video</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="websiteSystemWalkthrough"
                checked={localChecklist.websiteSystemWalkthrough || false}
                onCheckedChange={(checked) => updateField('websiteSystemWalkthrough', checked)}
                disabled={readonly}
              />
              <Label htmlFor="websiteSystemWalkthrough" className="text-sm">Website/system walkthrough</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Day of Launch – Training Confirmation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">5. Day of Launch – Training Confirmation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <Label className="text-base font-medium">Bag Loading Training:</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="introducedToStoreManager"
                checked={localChecklist.introducedToStoreManager || false}
                onCheckedChange={(checked) => updateField('introducedToStoreManager', checked)}
                disabled={readonly}
              />
              <Label htmlFor="introducedToStoreManager">Introduced to store manager/owner</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allRelevantStaffPresent"
                checked={localChecklist.allRelevantStaffPresent || false}
                onCheckedChange={(checked) => updateField('allRelevantStaffPresent', checked)}
                disabled={readonly}
              />
              <Label htmlFor="allRelevantStaffPresent">All relevant staff present (produce, bakery, floor manager)</Label>
            </div>
            
            <div className="ml-6 space-y-2">
              <Label className="text-sm font-medium">Staff trained on:</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="wasteRemovalProcessTrained"
                  checked={localChecklist.wasteRemovalProcessTrained || false}
                  onCheckedChange={(checked) => updateField('wasteRemovalProcessTrained', checked)}
                  disabled={readonly}
                />
                <Label htmlFor="wasteRemovalProcessTrained" className="text-sm">Waste removal process</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="wasteRecordingTrained"
                  checked={localChecklist.wasteRecordingTrained || false}
                  onCheckedChange={(checked) => updateField('wasteRecordingTrained', checked)}
                  disabled={readonly}
                />
                <Label htmlFor="wasteRecordingTrained" className="text-sm">Waste recording</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="correctBagPackingTrained"
                  checked={localChecklist.correctBagPackingTrained || false}
                  onCheckedChange={(checked) => updateField('correctBagPackingTrained', checked)}
                  disabled={readonly}
                />
                <Label htmlFor="correctBagPackingTrained" className="text-sm">Correct bag packing procedures</Label>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="staffUnderstandingConfirmed"
                checked={localChecklist.staffUnderstandingConfirmed || false}
                onCheckedChange={(checked) => updateField('staffUnderstandingConfirmed', checked)}
                disabled={readonly}
              />
              <Label htmlFor="staffUnderstandingConfirmed">Staff understanding confirmed during training</Label>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label className="text-base font-medium">Collection Process:</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="collectionTimesDiscussed"
                checked={localChecklist.collectionTimesDiscussed || false}
                onCheckedChange={(checked) => updateField('collectionTimesDiscussed', checked)}
                disabled={readonly}
              />
              <Label htmlFor="collectionTimesDiscussed">Collection times discussed with store</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="customerCollectionProceduresExplained"
                checked={localChecklist.customerCollectionProceduresExplained || false}
                onCheckedChange={(checked) => updateField('customerCollectionProceduresExplained', checked)}
                disabled={readonly}
              />
              <Label htmlFor="customerCollectionProceduresExplained">Customer collection procedures explained</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6. System & Website Training */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">6. System & Website Training</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="retailerTrainedOnWebsite"
              checked={localChecklist.retailerTrainedOnWebsite || false}
              onCheckedChange={(checked) => updateField('retailerTrainedOnWebsite', checked)}
              disabled={readonly}
            />
            <Label htmlFor="retailerTrainedOnWebsite">Retailer/Manager trained on Still Good website</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="storeLoginCreated"
              checked={localChecklist.storeLoginCreated || false}
              onCheckedChange={(checked) => updateField('storeLoginCreated', checked)}
              disabled={readonly}
            />
            <Label htmlFor="storeLoginCreated">Store Login Created</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="loadBagsLinkConfirmed"
              checked={localChecklist.loadBagsLinkConfirmed || false}
              onCheckedChange={(checked) => updateField('loadBagsLinkConfirmed', checked)}
              disabled={readonly}
            />
            <Label htmlFor="loadBagsLinkConfirmed">Load Bags Link Confirmed</Label>
          </div>
        </CardContent>
      </Card>

      {/* 7. Operational Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">7. Operational Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-base font-medium">Categories Active (select all that apply):</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="categoriesProduce"
                checked={localChecklist.categoriesActive?.produce || false}
                onCheckedChange={(checked) => updateNestedField('categoriesActive', 'produce', checked)}
                disabled={readonly}
              />
              <Label htmlFor="categoriesProduce">Produce</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="categoriesBakery"
                checked={localChecklist.categoriesActive?.bakery || false}
                onCheckedChange={(checked) => updateNestedField('categoriesActive', 'bakery', checked)}
                disabled={readonly}
              />
              <Label htmlFor="categoriesBakery">Bakery</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="categoriesGrocery"
                checked={localChecklist.categoriesActive?.grocery || false}
                onCheckedChange={(checked) => updateNestedField('categoriesActive', 'grocery', checked)}
                disabled={readonly}
              />
              <Label htmlFor="categoriesGrocery">Grocery</Label>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="flexMessagingSetup"
              checked={localChecklist.flexMessagingSetup || false}
              onCheckedChange={(checked) => updateField('flexMessagingSetup', checked)}
              disabled={readonly}
            />
            <Label htmlFor="flexMessagingSetup">Flex Messaging Set Up</Label>
            <span className="text-xs text-gray-500 ml-2">({(localChecklist.flexMessagingSetup || false).toString()})</span>
          </div>
          
          {localChecklist.flexMessagingSetup && (
            <div className="ml-6">
              <Label htmlFor="flexMessageDetails">Message details:</Label>
              <Textarea
                id="flexMessageDetails"
                value={localChecklist.flexMessageDetails || ''}
                onChange={(e) => updateField('flexMessageDetails', e.target.value)}
                placeholder="Enter flex message details..."
                disabled={readonly}
                className="mt-1"
              />
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="bagsTapeStickersOrdered"
              checked={localChecklist.bagsTapeStickersOrdered || false}
              onCheckedChange={(checked) => updateField('bagsTapeStickersOrdered', checked)}
              disabled={readonly}
            />
            <Label htmlFor="bagsTapeStickersOrdered">Bags, Tape & Stickers Ordered for Launch</Label>
          </div>
        </CardContent>
      </Card>

      {/* 8. Training Completion */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">8. Training Completion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="trainingFullyCompleted"
              checked={localChecklist.trainingFullyCompleted || false}
              onCheckedChange={(checked) => updateField('trainingFullyCompleted', checked)}
              disabled={readonly}
            />
            <Label htmlFor="trainingFullyCompleted">Training Fully Completed</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="followUpRequired"
              checked={localChecklist.followUpRequired || false}
              onCheckedChange={(checked) => updateField('followUpRequired', checked)}
              disabled={readonly}
            />
            <Label htmlFor="followUpRequired">Follow-Up Required</Label>
            <span className="text-xs text-gray-500 ml-2">({(localChecklist.followUpRequired || false).toString()})</span>
          </div>
          
          {localChecklist.followUpRequired && (
            <div>
              <Label htmlFor="followUpNotes">Follow-up Notes:</Label>
              <Textarea
                id="followUpNotes"
                value={localChecklist.followUpNotes || ''}
                onChange={(e) => updateField('followUpNotes', e.target.value)}
                placeholder="Enter follow-up notes..."
                disabled={readonly}
                className="mt-1"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 9. Ops Team Sign-Off */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">9. Ops Team Sign-Off</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="opsTeamMemberName">Ops Team Member Name:</Label>
            <Input
              id="opsTeamMemberName"
              value={localChecklist.opsTeamMemberName || ''}
              onChange={(e) => updateField('opsTeamMemberName', e.target.value)}
              placeholder="Enter ops team member name..."
              disabled={readonly}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label>Ops Sign-Off Date:</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left font-normal mt-1"
                  disabled={readonly}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {(() => {
                    const opsDate = normalizeDate(localChecklist.opsSignOffDate)
                    return opsDate ? format(opsDate, "PPP") : "Select date..."
                  })()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={normalizeDate(localChecklist.opsSignOffDate) ?? undefined}
                  onSelect={(date) => updateField('opsSignOffDate', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <Label htmlFor="additionalNotes">Additional Notes / Risks / Observations:</Label>
            <Textarea
              id="additionalNotes"
              value={localChecklist.additionalNotes || ''}
              onChange={(e) => updateField('additionalNotes', e.target.value)}
              placeholder="Enter additional notes, risks, or observations..."
              disabled={readonly}
              className="mt-1"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}